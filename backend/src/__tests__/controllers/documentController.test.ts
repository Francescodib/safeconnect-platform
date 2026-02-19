import { Response, NextFunction } from 'express';
import documentController from '../../controllers/documentController';
import { AuthRequest } from '../../middleware/auth';

jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

jest.mock('../../models', () => ({
  Document: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findAndCountAll: jest.fn(),
  },
}));

jest.mock('../../services/auditService', () => ({
  __esModule: true,
  default: {
    log: jest.fn().mockResolvedValue(undefined),
  },
}));

import { Document } from '../../models';

const mockDocument = Document as jest.Mocked<typeof Document>;

const makeRes = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

const makeReq = (overrides: Partial<AuthRequest> = {}): AuthRequest =>
  ({
    body: {},
    params: {},
    query: {},
    ip: '127.0.0.1',
    get: jest.fn(),
    userId: 'owner-uuid',
    ...overrides,
  }) as unknown as AuthRequest;

const fakeDoc = {
  id: 'doc-uuid',
  title: 'Test Document',
  content: 'Content here',
  ownerId: 'owner-uuid',
  shared: false,
  save: jest.fn().mockResolvedValue(undefined),
  destroy: jest.fn().mockResolvedValue(undefined),
};

describe('DocumentController', () => {
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    next = jest.fn();
    jest.clearAllMocks();
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('returns 201 with the created document', async () => {
      mockDocument.create = jest.fn().mockResolvedValue(fakeDoc);

      const req = makeReq({ body: { title: 'Test', content: 'Content' } });
      const res = makeRes();

      await documentController.create(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: fakeDoc })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next with ApiError 401 when userId is missing', async () => {
      const req = makeReq({ userId: undefined });

      await documentController.create(req, makeRes(), next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('sets shared to false by default', async () => {
      mockDocument.create = jest.fn().mockResolvedValue(fakeDoc);

      const req = makeReq({ body: { title: 'Test', content: 'Content' } });
      await documentController.create(req, makeRes(), next);

      expect(mockDocument.create).toHaveBeenCalledWith(
        expect.objectContaining({ shared: false })
      );
    });
  });

  // ─── getAll ───────────────────────────────────────────────────────────────

  describe('getAll', () => {
    it('returns 200 with documents and pagination data', async () => {
      mockDocument.findAndCountAll = jest.fn().mockResolvedValue({
        count: 2,
        rows: [fakeDoc, { ...fakeDoc, id: 'doc-2' }],
      });

      const req = makeReq({ query: { page: '1', limit: '10' } });
      const res = makeRes();

      await documentController.getAll(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            pagination: expect.objectContaining({ page: 1, limit: 10, total: 2 }),
          }),
        })
      );
    });

    it('calls next with ApiError 401 when userId is missing', async () => {
      const req = makeReq({ userId: undefined });

      await documentController.getAll(req, makeRes(), next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('uses default pagination values when not provided', async () => {
      mockDocument.findAndCountAll = jest.fn().mockResolvedValue({ count: 0, rows: [] });

      const req = makeReq({ query: {} });
      await documentController.getAll(req, makeRes(), next);

      expect(mockDocument.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 10, offset: 0 })
      );
    });
  });

  // ─── getById ──────────────────────────────────────────────────────────────

  describe('getById', () => {
    it('returns 200 with the document when the user is the owner', async () => {
      mockDocument.findByPk = jest.fn().mockResolvedValue(fakeDoc);

      const req = makeReq({ params: { id: 'doc-uuid' }, userId: 'owner-uuid' });
      const res = makeRes();

      await documentController.getById(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: fakeDoc })
      );
    });

    it('returns 200 when the document is shared and the user is not the owner', async () => {
      const sharedDoc = { ...fakeDoc, shared: true, ownerId: 'other-uuid' };
      mockDocument.findByPk = jest.fn().mockResolvedValue(sharedDoc);

      const req = makeReq({ params: { id: 'doc-uuid' }, userId: 'visitor-uuid' });
      const res = makeRes();

      await documentController.getById(req, res, next);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('calls next with ApiError 404 when document is not found', async () => {
      mockDocument.findByPk = jest.fn().mockResolvedValue(null);

      const req = makeReq({ params: { id: 'missing-uuid' } });

      await documentController.getById(req, makeRes(), next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });

    it('calls next with ApiError 403 when user is not the owner and document is not shared', async () => {
      const privateDoc = { ...fakeDoc, shared: false, ownerId: 'other-uuid' };
      mockDocument.findByPk = jest.fn().mockResolvedValue(privateDoc);

      const req = makeReq({ params: { id: 'doc-uuid' }, userId: 'visitor-uuid' });

      await documentController.getById(req, makeRes(), next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('saves changes and returns 200 when the user is the owner', async () => {
      const doc = { ...fakeDoc, save: jest.fn().mockResolvedValue(undefined) };
      mockDocument.findByPk = jest.fn().mockResolvedValue(doc);

      const req = makeReq({
        params: { id: 'doc-uuid' },
        body: { title: 'Updated Title' },
        userId: 'owner-uuid',
      });
      const res = makeRes();

      await documentController.update(req, res, next);

      expect(doc.title).toBe('Updated Title');
      expect(doc.save).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('calls next with ApiError 404 when document is not found', async () => {
      mockDocument.findByPk = jest.fn().mockResolvedValue(null);

      const req = makeReq({ params: { id: 'missing' }, body: { title: 'x' } });

      await documentController.update(req, makeRes(), next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });

    it('calls next with ApiError 403 when the user is not the owner', async () => {
      const doc = { ...fakeDoc, ownerId: 'other-uuid' };
      mockDocument.findByPk = jest.fn().mockResolvedValue(doc);

      const req = makeReq({ params: { id: 'doc-uuid' }, body: {}, userId: 'intruder-uuid' });

      await documentController.update(req, makeRes(), next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    });
  });

  // ─── delete ───────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('destroys the document and returns 200 when the user is the owner', async () => {
      const doc = { ...fakeDoc, destroy: jest.fn().mockResolvedValue(undefined) };
      mockDocument.findByPk = jest.fn().mockResolvedValue(doc);

      const req = makeReq({ params: { id: 'doc-uuid' }, userId: 'owner-uuid' });
      const res = makeRes();

      await documentController.delete(req, res, next);

      expect(doc.destroy).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Document deleted successfully' })
      );
    });

    it('calls next with ApiError 404 when document is not found', async () => {
      mockDocument.findByPk = jest.fn().mockResolvedValue(null);

      const req = makeReq({ params: { id: 'missing' } });

      await documentController.delete(req, makeRes(), next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });

    it('calls next with ApiError 403 when the user is not the owner', async () => {
      const doc = { ...fakeDoc, ownerId: 'other-uuid' };
      mockDocument.findByPk = jest.fn().mockResolvedValue(doc);

      const req = makeReq({ params: { id: 'doc-uuid' }, userId: 'intruder-uuid' });

      await documentController.delete(req, makeRes(), next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    });
  });
});
