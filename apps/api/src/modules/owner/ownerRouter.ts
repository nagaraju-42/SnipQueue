import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorise } from '../../middlewares/auth.js';
import * as ownerService from './ownerService.js';

export const ownerRouter: Router = Router();

// All owner routes require OWNER role
ownerRouter.use(authenticate, authorise('OWNER', 'ADMIN'));

// GET /owner/dashboard/today — Today's summary
ownerRouter.get(
  '/dashboard/today',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await ownerService.getDashboardToday(req.user!.id);
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }
);

// GET /owner/salary — Compute salary
ownerRouter.get(
  '/salary',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { month, year, ratePerSlot } = req.query;
      const salary = await ownerService.computeSalary(req.user!.id, {
        month: month ? parseInt(month as string) : undefined,
        year: year ? parseInt(year as string) : undefined,
        ratePerSlot: ratePerSlot ? parseInt(ratePerSlot as string) : undefined,
      });
      res.json({ success: true, data: salary });
    } catch (error) {
      next(error);
    }
  }
);

// POST /owner/salary/mark-paid — Mark salary as paid
ownerRouter.post(
  '/salary/mark-paid',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await ownerService.markSalaryPaid(req.user!.id, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// GET /owner/revenue — Revenue report
ownerRouter.get(
  '/revenue',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate } = req.query;
      const revenue = await ownerService.getRevenue(req.user!.id, {
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
      });
      res.json({ success: true, data: revenue });
    } catch (error) {
      next(error);
    }
  }
);
