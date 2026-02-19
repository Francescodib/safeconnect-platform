import { Router, type Router as RouterType } from 'express';
import documentController from '../controllers/documentController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createDocumentValidation, updateDocumentValidation } from '../utils/validators';

const router: RouterType = Router();

// All document routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/documents
 * @desc    Create a new document
 * @access  Private
 */
router.post('/', createDocumentValidation, validate, documentController.create);

/**
 * @route   GET /api/documents
 * @desc    Get all documents accessible by user
 * @access  Private
 */
router.get('/', documentController.getAll);

/**
 * @route   GET /api/documents/:id
 * @desc    Get a document by ID
 * @access  Private
 */
router.get('/:id', documentController.getById);

/**
 * @route   PUT /api/documents/:id
 * @desc    Update a document
 * @access  Private (Owner only)
 */
router.put('/:id', updateDocumentValidation, validate, documentController.update);

/**
 * @route   DELETE /api/documents/:id
 * @desc    Delete a document
 * @access  Private (Owner only)
 */
router.delete('/:id', documentController.delete);

export default router;
