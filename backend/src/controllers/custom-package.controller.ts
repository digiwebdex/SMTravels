import type { Request, Response } from "express";
import * as cp from "../services/custom-package.service";
import {
  inquiryListQuerySchema, inquiryCreateSchema, inquiryUpdateSchema, inquiryTransitionSchema,
  packageListQuerySchema, packageCreateSchema, packageUpdateSchema, packageTransitionSchema,
  itemCreateSchema, itemUpdateSchema,
} from "../contracts/custom-package.contract";

// Inquiries
export async function listInquiriesHandler(req: Request, res: Response) { res.json(await cp.listInquiries(req.auth!, inquiryListQuerySchema.parse(req.query))); }
export async function createInquiryHandler(req: Request, res: Response) { res.status(201).json(await cp.createInquiry(req.auth!, inquiryCreateSchema.parse(req.body))); }
export async function updateInquiryHandler(req: Request, res: Response) { res.json(await cp.updateInquiry(req.auth!, req.params.id, inquiryUpdateSchema.parse(req.body))); }
export async function transitionInquiryHandler(req: Request, res: Response) { res.json(await cp.transitionInquiry(req.auth!, req.params.id, inquiryTransitionSchema.parse(req.body))); }
export async function archiveInquiryHandler(req: Request, res: Response) { res.json(await cp.archiveInquiry(req.auth!, req.params.id)); }

// Custom packages
export async function listPackagesHandler(req: Request, res: Response) { res.json(await cp.listPackages(req.auth!, packageListQuerySchema.parse(req.query))); }
export async function getPackageHandler(req: Request, res: Response) { res.json(await cp.getPackage(req.auth!, req.params.id)); }
export async function createPackageHandler(req: Request, res: Response) { res.status(201).json(await cp.createPackage(req.auth!, packageCreateSchema.parse(req.body))); }
export async function updatePackageHandler(req: Request, res: Response) { res.json(await cp.updatePackage(req.auth!, req.params.id, packageUpdateSchema.parse(req.body))); }
export async function transitionPackageHandler(req: Request, res: Response) { res.json(await cp.transitionPackage(req.auth!, req.params.id, packageTransitionSchema.parse(req.body))); }
export async function convertPackageHandler(req: Request, res: Response) { res.json(await cp.convertToBooking(req.auth!, req.params.id)); }
export async function archivePackageHandler(req: Request, res: Response) { res.json(await cp.archivePackage(req.auth!, req.params.id)); }

// Items
export async function addItemHandler(req: Request, res: Response) { res.status(201).json(await cp.addItem(req.auth!, req.params.id, itemCreateSchema.parse(req.body))); }
export async function updateItemHandler(req: Request, res: Response) { res.json(await cp.updateItem(req.auth!, req.params.itemId, itemUpdateSchema.parse(req.body))); }
export async function removeItemHandler(req: Request, res: Response) { res.json(await cp.removeItem(req.auth!, req.params.itemId)); }
