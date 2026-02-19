import { Response, NextFunction } from 'express';
import { Document } from '../models';
import { ApiError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import auditService from '../services/auditService';
import logger from '../config/logger';
import { Op } from 'sequelize';

const safeOwnerInclude = {
  association: 'owner' as const,
  attributes: ['id', 'email', 'firstName', 'lastName', 'role'],
};

class DocumentController {
  /**
   * Create a new document
   */
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.userId) {
        throw new ApiError(401, 'Not authenticated');
      }

      const { title, content, shared } = req.body;
      const ip = req.ip || 'unknown';

      const document = await Document.create({
        title,
        content,
        ownerId: req.userId,
        shared: shared || false,
      });

      await auditService.log({
        action: 'document_created',
        userId: req.userId,
        ip,
        details: { documentId: document.id, title },
      });

      logger.info('Document created', { documentId: document.id, userId: req.userId });

      res.status(201).json({
        success: true,
        data: document,
        message: 'Document created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all documents accessible by user
   */
  async getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.userId) {
        throw new ApiError(401, 'Not authenticated');
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      // User can see their own documents + shared documents
      const where = {
        [Op.or]: [{ ownerId: req.userId }, { shared: true }],
      };

      const { count, rows: documents } = await Document.findAndCountAll({
        where,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        include: [safeOwnerInclude],
      });

      res.json({
        success: true,
        data: {
          documents,
          pagination: {
            page,
            limit,
            total: count,
            pages: Math.ceil(count / limit),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single document by ID
   */
  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.userId) {
        throw new ApiError(401, 'Not authenticated');
      }

      const id = req.params.id as string;

      const document = await Document.findByPk(id, {
        include: [safeOwnerInclude],
      });

      if (!document) {
        throw new ApiError(404, 'Document not found');
      }

      // Check permissions
      if (document.ownerId !== req.userId && !document.shared) {
        throw new ApiError(403, 'You do not have permission to access this document');
      }

      await auditService.log({
        action: 'document_accessed',
        userId: req.userId,
        ip: req.ip || 'unknown',
        details: { documentId: id },
      });

      res.json({
        success: true,
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a document
   */
  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.userId) {
        throw new ApiError(401, 'Not authenticated');
      }

      const id = req.params.id as string;
      const { title, content, shared } = req.body;

      const document = await Document.findByPk(id);

      if (!document) {
        throw new ApiError(404, 'Document not found');
      }

      // Only owner can update
      if (document.ownerId !== req.userId) {
        throw new ApiError(403, 'You do not have permission to update this document');
      }

      // Update fields
      if (title !== undefined) document.title = title;
      if (content !== undefined) document.content = content;
      if (shared !== undefined) document.shared = shared;

      await document.save();

      await auditService.log({
        action: 'document_updated',
        userId: req.userId,
        ip: req.ip || 'unknown',
        details: { documentId: id, changes: { title, content, shared } },
      });

      logger.info('Document updated', { documentId: id, userId: req.userId });

      res.json({
        success: true,
        data: document,
        message: 'Document updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a document
   */
  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.userId) {
        throw new ApiError(401, 'Not authenticated');
      }

      const id = req.params.id as string;

      const document = await Document.findByPk(id);

      if (!document) {
        throw new ApiError(404, 'Document not found');
      }

      // Only owner can delete
      if (document.ownerId !== req.userId) {
        throw new ApiError(403, 'You do not have permission to delete this document');
      }

      await document.destroy();

      await auditService.log({
        action: 'document_deleted',
        userId: req.userId,
        ip: req.ip || 'unknown',
        details: { documentId: id, title: document.title },
      });

      logger.info('Document deleted', { documentId: id, userId: req.userId });

      res.json({
        success: true,
        message: 'Document deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new DocumentController();
