-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'COMPANY_ADMIN', 'BRANCH_MANAGER', 'STAFF', 'ACCOUNTANT', 'SALES_EXECUTIVE', 'VISA_EXECUTIVE', 'HAJJ_EXECUTIVE', 'UMRAH_EXECUTIVE', 'AGENT', 'SUPPLIER', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('BDT', 'USD', 'SAR');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('HAJJ', 'UMRAH', 'VISA', 'AIR_TICKET', 'MANPOWER', 'TOUR', 'HOTEL');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('DRAFT', 'PENDING', 'PROCESSING', 'CONFIRMED', 'ON_HOLD', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StageStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DONE', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "MahramRelation" AS ENUM ('HUSBAND', 'FATHER', 'BROTHER', 'SON', 'UNCLE', 'OTHER');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('INDIVIDUAL', 'CORPORATE');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('PASSPORT', 'PHOTO', 'VISA', 'NID', 'MEDICAL', 'VACCINATION', 'AIR_TICKET', 'HOTEL', 'INSURANCE', 'CONTRACT', 'LICENSE', 'MAHRAM_CERT', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('MISSING', 'UPLOADED', 'PENDING', 'VERIFIED', 'EXPIRING', 'EXPIRED', 'FAILED', 'NOT_REQUIRED');

-- CreateEnum
CREATE TYPE "DocumentOwnerType" AS ENUM ('BOOKING', 'TRAVELER', 'CUSTOMER', 'SUPPLIER', 'COMPANY');

-- CreateEnum
CREATE TYPE "PackageStatus" AS ENUM ('ACTIVE', 'DRAFT', 'ARCHIVED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'BKASH', 'NAGAD', 'ROCKET', 'CHEQUE', 'CARD', 'SSLCOMMERZ');

-- CreateEnum
CREATE TYPE "PaymentDirection" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'REVERSED');

-- CreateEnum
CREATE TYPE "InstallmentStatus" AS ENUM ('UPCOMING', 'DUE', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "PayableStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'APPROVED', 'PROCESSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PromoType" AS ENUM ('FLAT', 'PERCENT');

-- CreateEnum
CREATE TYPE "PromoStatus" AS ENUM ('ACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AccountClass" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');

-- CreateEnum
CREATE TYPE "AccountRole" AS ENUM ('HEADER', 'DETAIL');

-- CreateEnum
CREATE TYPE "NormalBalance" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "BankAccountType" AS ENUM ('CURRENT', 'SAVINGS', 'PETTY_CASH', 'CASH');

-- CreateEnum
CREATE TYPE "JournalStatus" AS ENUM ('DRAFT', 'POSTED');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('PENDING', 'PAID');

-- CreateEnum
CREATE TYPE "IncomeStatus" AS ENUM ('PENDING', 'CONFIRMED');

-- CreateEnum
CREATE TYPE "LeadStage" AS ENUM ('NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "LeadInterest" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE');

-- CreateEnum
CREATE TYPE "AgentTier" AS ENUM ('SILVER', 'GOLD', 'PLATINUM');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'PAID');

-- CreateEnum
CREATE TYPE "WalletTxnType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "SupplierStatus" AS ENUM ('PENDING', 'VERIFIED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "BookingRequestStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('PUBLISHED', 'DRAFT', 'SCHEDULED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BannerType" AS ENUM ('PROMO', 'HERO', 'SIDEBAR', 'CTA');

-- CreateEnum
CREATE TYPE "MenuLocation" AS ENUM ('MAIN_NAV', 'FOOTER_NAV', 'MOBILE_NAV');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'PDF', 'DOC');

-- CreateEnum
CREATE TYPE "MessageChannel" AS ENUM ('INTERNAL', 'GROUP', 'ANNOUNCEMENTS', 'EMAIL', 'SMS', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "TemplateChannel" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'PENDING', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "AuditSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "registrationNo" TEXT,
    "tin" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "primaryColor" TEXT DEFAULT '#0E6BB8',
    "defaultCurrency" "Currency" NOT NULL DEFAULT 'BDT',
    "defaultLanguage" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Dhaka',
    "fiscalYearStart" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "hours" TEXT,
    "mapUrl" TEXT,
    "isHq" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "managerId" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "branchId" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "status" TEXT NOT NULL DEFAULT 'active',
    "avatarUrl" TEXT,
    "employeeId" TEXT,
    "department" TEXT,
    "nid" TEXT,
    "nidHash" TEXT,
    "piiKeyId" INTEGER,
    "lastActiveAt" TIMESTAMPTZ(6),
    "twoFactor" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "access" TEXT NOT NULL DEFAULT 'full',

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "UserRoleLink" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "UserRoleLink_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "userId" TEXT,
    "agentId" TEXT,
    "type" "CustomerType" NOT NULL DEFAULT 'INDIVIDUAL',
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "nid" TEXT,
    "nidHash" TEXT,
    "passportNo" TEXT,
    "passportHash" TEXT,
    "piiKeyId" INTEGER,
    "dob" DATE,
    "addressLine" TEXT,
    "district" TEXT,
    "division" TEXT,
    "country" TEXT DEFAULT 'Bangladesh',
    "rating" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorporateClient" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactPerson" TEXT,
    "tradeLicense" TEXT,
    "tin" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "CorporateClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "source" TEXT,
    "serviceInterest" "ServiceType",
    "quantity" INTEGER,
    "interest" "LeadInterest" NOT NULL DEFAULT 'MEDIUM',
    "stage" "LeadStage" NOT NULL DEFAULT 'NEW',
    "assignedToId" TEXT,
    "agentId" TEXT,
    "customerId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadActivity" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "note" TEXT,
    "actorId" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUp" (
    "id" TEXT NOT NULL,
    "leadId" TEXT,
    "customerId" TEXT,
    "assignedToId" TEXT,
    "dueAt" TIMESTAMPTZ(6) NOT NULL,
    "note" TEXT,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallLog" (
    "id" TEXT NOT NULL,
    "leadId" TEXT,
    "customerId" TEXT,
    "direction" TEXT NOT NULL,
    "durationSec" INTEGER,
    "note" TEXT,
    "byId" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assigneeId" TEXT,
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "category" TEXT,
    "tags" TEXT[],
    "dueAt" TIMESTAMPTZ(6),
    "commentsCount" INTEGER NOT NULL DEFAULT 0,
    "relatedBookingId" TEXT,
    "relatedLeadId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "leadId" TEXT,
    "customerId" TEXT,
    "bookingId" TEXT,
    "authorId" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" "ServiceType" NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "defaultCurrency" "Currency" NOT NULL DEFAULT 'BDT',
    "refPrefix" TEXT,
    "maxGroupSize" INTEGER,
    "minLeadTimeDays" INTEGER,
    "showOnWebsite" BOOLEAN NOT NULL DEFAULT true,
    "allowDirectBooking" BOOLEAN NOT NULL DEFAULT true,
    "requireApproval" BOOLEAN NOT NULL DEFAULT false,
    "enableAgentCommission" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "serviceId" TEXT,
    "type" "ServiceType" NOT NULL,
    "name" TEXT NOT NULL,
    "season" TEXT,
    "departure" TEXT,
    "duration" TEXT,
    "status" "PackageStatus" NOT NULL DEFAULT 'DRAFT',
    "basePrice" DECIMAL(18,4) NOT NULL,
    "originalPrice" DECIMAL(18,4),
    "currency" "Currency" NOT NULL DEFAULT 'BDT',
    "exchangeRate" DECIMAL(18,8) NOT NULL DEFAULT 1,
    "baseAmount" DECIMAL(18,4) NOT NULL,
    "totalSeats" INTEGER NOT NULL DEFAULT 0,
    "availableSeats" INTEGER NOT NULL DEFAULT 0,
    "rating" DECIMAL(3,2),
    "bookingsCount" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "image" TEXT,
    "images" TEXT[],
    "shortDesc" TEXT,
    "longDesc" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "hotels" JSONB,
    "flights" JSONB,
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackagePricing" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "price" DECIMAL(18,4) NOT NULL,
    "originalPrice" DECIMAL(18,4),
    "currency" "Currency" NOT NULL DEFAULT 'BDT',
    "exchangeRate" DECIMAL(18,8) NOT NULL DEFAULT 1,
    "baseAmount" DECIMAL(18,4) NOT NULL,
    "seats" INTEGER NOT NULL DEFAULT 0,
    "occupied" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PackagePricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageItinerary" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "activities" TEXT[],
    "hotel" TEXT,
    "breakfast" BOOLEAN NOT NULL DEFAULT false,
    "lunch" BOOLEAN NOT NULL DEFAULT false,
    "dinner" BOOLEAN NOT NULL DEFAULT false,
    "transport" TEXT,

    CONSTRAINT "PackageItinerary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageInclusion" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PackageInclusion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageAvailability" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "departureDate" DATE NOT NULL,
    "totalSeats" INTEGER NOT NULL DEFAULT 0,
    "soldSeats" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'open',

    CONSTRAINT "PackageAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "bookingNo" TEXT,
    "branchId" TEXT NOT NULL,
    "customerId" TEXT,
    "packageId" TEXT,
    "serviceType" "ServiceType" NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'DRAFT',
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "wizardData" JSONB,
    "assignedStaffId" TEXT,
    "agentId" TEXT,
    "source" TEXT,
    "amount" DECIMAL(18,4) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'BDT',
    "exchangeRate" DECIMAL(18,8) NOT NULL DEFAULT 1,
    "baseAmount" DECIMAL(18,4) NOT NULL,
    "paidAmount" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "discountType" TEXT,
    "discountValue" DECIMAL(18,4),
    "discountApprovedById" TEXT,
    "travelersCount" INTEGER NOT NULL DEFAULT 1,
    "departureDate" DATE,
    "returnDate" DATE,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HajjBooking" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "packageTier" TEXT,
    "season" TEXT,
    "groupAssign" TEXT,
    "departureDate" DATE,
    "returnDate" DATE,
    "roomType" TEXT,
    "transport" TEXT,
    "hotelMakkah" TEXT,
    "hotelMadinah" TEXT,
    "daysMakkah" INTEGER,
    "daysMadinah" INTEGER,
    "mahramRequired" BOOLEAN NOT NULL DEFAULT false,
    "specialRequests" TEXT,
    "stageStatus" "StageStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "HajjBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UmrahBooking" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "packageTier" TEXT,
    "season" TEXT,
    "departureDate" DATE,
    "returnDate" DATE,
    "roomType" TEXT,
    "transport" TEXT,
    "hotelMakkah" TEXT,
    "hotelMadinah" TEXT,
    "daysMakkah" INTEGER,
    "daysMadinah" INTEGER,
    "mahramRequired" BOOLEAN NOT NULL DEFAULT false,
    "specialRequests" TEXT,
    "stageStatus" "StageStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "UmrahBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisaBooking" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "destinationCountry" TEXT NOT NULL,
    "visaType" TEXT NOT NULL,
    "processingSpeed" TEXT,
    "passportCount" INTEGER NOT NULL DEFAULT 1,
    "purpose" TEXT,
    "visaNumber" TEXT,
    "visaExpiry" DATE,
    "stageStatus" "StageStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,

    CONSTRAINT "VisaBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AirTicketBooking" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "airline" TEXT,
    "pnr" TEXT,
    "journeyType" TEXT,
    "origin" TEXT,
    "destination" TEXT,
    "cabinClass" TEXT,
    "departAt" TIMESTAMPTZ(6),
    "returnAt" TIMESTAMPTZ(6),
    "baseFare" DECIMAL(18,4),
    "taxAmount" DECIMAL(18,4),
    "agentMarkup" DECIMAL(18,4),
    "fareType" TEXT,
    "baggage" TEXT,

    CONSTRAINT "AirTicketBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HotelBooking" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "city" TEXT,
    "hotelName" TEXT,
    "starRating" INTEGER,
    "checkIn" DATE,
    "checkOut" DATE,
    "roomType" TEXT,
    "rooms" INTEGER,
    "guests" INTEGER,
    "boardBasis" TEXT,
    "confirmationNo" TEXT,
    "distanceFromHaram" TEXT,
    "specialRequests" TEXT,

    CONSTRAINT "HotelBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManpowerBooking" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "workerCategory" TEXT,
    "jobTitle" TEXT,
    "destinationCountry" TEXT,
    "destinationCity" TEXT,
    "employer" TEXT,
    "contractDuration" TEXT,
    "monthlySalary" TEXT,
    "accommodation" TEXT,
    "stageStatus" "StageStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "ManpowerBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourBooking" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "packageTier" TEXT,
    "tourType" TEXT,
    "destinations" TEXT,
    "duration" TEXT,
    "departureDate" DATE,
    "returnDate" DATE,
    "travelers" INTEGER,
    "hotelCategory" TEXT,
    "roomSharing" TEXT,
    "mealPlan" TEXT,
    "itineraryNote" TEXT,

    CONSTRAINT "TourBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Traveler" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dob" DATE,
    "gender" "Gender",
    "nationality" TEXT DEFAULT 'Bangladeshi',
    "passportNo" TEXT,
    "passportHash" TEXT,
    "piiKeyId" INTEGER,
    "passportExpiry" DATE,
    "phone" TEXT,
    "email" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "mahramRelation" "MahramRelation",
    "mahramOfId" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Traveler_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "ownerType" "DocumentOwnerType" NOT NULL,
    "bookingId" TEXT,
    "travelerId" TEXT,
    "customerId" TEXT,
    "supplierId" TEXT,
    "type" "DocumentType" NOT NULL,
    "name" TEXT NOT NULL,
    "filePath" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "status" "DocumentStatus" NOT NULL DEFAULT 'MISSING',
    "required" BOOLEAN NOT NULL DEFAULT false,
    "expiryAt" DATE,
    "tags" TEXT[],
    "ocrStatus" TEXT,
    "ocrConfidence" INTEGER,
    "ocrName" TEXT,
    "ocrPassportNo" TEXT,
    "ocrPassportHash" TEXT,
    "ocrDob" DATE,
    "ocrExpiry" DATE,
    "ocrNationality" TEXT,
    "piiKeyId" INTEGER,
    "uploadedById" TEXT,
    "verifiedById" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingCharge" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'BDT',
    "exchangeRate" DECIMAL(18,8) NOT NULL DEFAULT 1,
    "baseAmount" DECIMAL(18,4) NOT NULL,
    "kind" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingCharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingStageEvent" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "status" "StageStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "byId" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingStageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingActivity" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNo" TEXT,
    "fiscalYear" INTEGER NOT NULL,
    "branchId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "bookingId" TEXT,
    "issueDate" DATE,
    "dueDate" DATE,
    "currency" "Currency" NOT NULL DEFAULT 'BDT',
    "exchangeRate" DECIMAL(18,8) NOT NULL DEFAULT 1,
    "subtotal" DECIMAL(18,4) NOT NULL,
    "discountAmount" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(9,4) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "total" DECIMAL(18,4) NOT NULL,
    "baseAmount" DECIMAL(18,4) NOT NULL,
    "paidAmount" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(18,4) NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "bookingId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "paymentNo" TEXT,
    "direction" "PaymentDirection" NOT NULL,
    "branchId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "bookingId" TEXT,
    "customerId" TEXT,
    "supplierId" TEXT,
    "amount" DECIMAL(18,4) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'BDT',
    "exchangeRate" DECIMAL(18,8) NOT NULL DEFAULT 1,
    "baseAmount" DECIMAL(18,4) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "gateway" TEXT,
    "reference" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'CONFIRMED',
    "receivedById" TEXT,
    "paidAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isReversed" BOOLEAN NOT NULL DEFAULT false,
    "reversalOfId" TEXT,
    "reversedById" TEXT,
    "postedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    "receiptNo" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'BDT',
    "baseAmount" DECIMAL(18,4) NOT NULL,
    "issuedById" TEXT,
    "issuedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstallmentPlan" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "bookingId" TEXT,
    "customerId" TEXT NOT NULL,
    "total" DECIMAL(18,4) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'BDT',
    "baseAmount" DECIMAL(18,4) NOT NULL,
    "downAmount" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "InstallmentPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Installment" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "label" TEXT,
    "amountDue" DECIMAL(18,4) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'BDT',
    "baseAmount" DECIMAL(18,4) NOT NULL,
    "dueDate" DATE NOT NULL,
    "paidDate" DATE,
    "paidAmount" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "status" "InstallmentStatus" NOT NULL DEFAULT 'UPCOMING',

    CONSTRAINT "Installment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "refundNo" TEXT,
    "branchId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "bookingId" TEXT,
    "customerId" TEXT,
    "reason" TEXT,
    "amount" DECIMAL(18,4) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'BDT',
    "exchangeRate" DECIMAL(18,8) NOT NULL DEFAULT 1,
    "baseAmount" DECIMAL(18,4) NOT NULL,
    "method" "PaymentMethod",
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "PromoType" NOT NULL,
    "value" DECIMAL(18,4) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'BDT',
    "scope" TEXT,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "usageLimit" INTEGER,
    "expiresAt" DATE,
    "status" "PromoStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "accountClass" "AccountClass" NOT NULL,
    "role" "AccountRole" NOT NULL DEFAULT 'DETAIL',
    "normalBalance" "NormalBalance" NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'BDT',
    "balance" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bankName" TEXT,
    "type" "BankAccountType" NOT NULL DEFAULT 'CURRENT',
    "accountNumber" TEXT,
    "iban" TEXT,
    "branchName" TEXT,
    "currency" "Currency" NOT NULL DEFAULT 'BDT',
    "balance" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "coaAccountId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "branchId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "description" TEXT,
    "currency" "Currency" NOT NULL DEFAULT 'BDT',
    "status" "JournalStatus" NOT NULL DEFAULT 'DRAFT',
    "relatedType" TEXT,
    "relatedId" TEXT,
    "postedById" TEXT,
    "postedAt" TIMESTAMPTZ(6),
    "isReversed" BOOLEAN NOT NULL DEFAULT false,
    "reversalOfId" TEXT,
    "reversedById" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalLine" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "debit" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "credit" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "narration" TEXT,

    CONSTRAINT "JournalLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "ref" TEXT,
    "branchId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "vendorName" TEXT,
    "supplierId" TEXT,
    "accountId" TEXT,
    "amount" DECIMAL(18,4) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'BDT',
    "exchangeRate" DECIMAL(18,8) NOT NULL DEFAULT 1,
    "baseAmount" DECIMAL(18,4) NOT NULL,
    "method" "PaymentMethod",
    "status" "ExpenseStatus" NOT NULL DEFAULT 'PENDING',
    "date" DATE NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Income" (
    "id" TEXT NOT NULL,
    "ref" TEXT,
    "branchId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "payerName" TEXT,
    "accountId" TEXT,
    "amount" DECIMAL(18,4) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'BDT',
    "exchangeRate" DECIMAL(18,8) NOT NULL DEFAULT 1,
    "baseAmount" DECIMAL(18,4) NOT NULL,
    "method" "PaymentMethod",
    "status" "IncomeStatus" NOT NULL DEFAULT 'PENDING',
    "date" DATE NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Income_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierPayable" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "supplierInvoiceId" TEXT,
    "amount" DECIMAL(18,4) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'BDT',
    "exchangeRate" DECIMAL(18,8) NOT NULL DEFAULT 1,
    "baseAmount" DECIMAL(18,4) NOT NULL,
    "paidAmount" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "dueDate" DATE,
    "status" "PayableStatus" NOT NULL DEFAULT 'PENDING',
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "SupplierPayable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "agentCode" TEXT NOT NULL,
    "userId" TEXT,
    "branchId" TEXT,
    "parentAgentId" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "nid" TEXT,
    "nidHash" TEXT,
    "piiKeyId" INTEGER,
    "tradeLicense" TEXT,
    "tier" "AgentTier" NOT NULL DEFAULT 'SILVER',
    "commissionRate" DECIMAL(9,4) NOT NULL DEFAULT 0,
    "bankName" TEXT,
    "accountNo" TEXT,
    "bankBranch" TEXT,
    "bkashNo" TEXT,
    "nagadNo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionTier" (
    "id" TEXT NOT NULL,
    "tier" "AgentTier" NOT NULL,
    "rate" DECIMAL(9,4) NOT NULL,
    "minBookings" INTEGER NOT NULL DEFAULT 0,
    "maxBookings" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CommissionTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentCommission" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "bookingId" TEXT,
    "period" TEXT,
    "grossAmount" DECIMAL(18,4) NOT NULL,
    "rate" DECIMAL(9,4) NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'BDT',
    "baseAmount" DECIMAL(18,4) NOT NULL,
    "isOverride" BOOLEAN NOT NULL DEFAULT false,
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "AgentCommission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentWallet" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "balance" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "currency" "Currency" NOT NULL DEFAULT 'BDT',
    "lastCreditAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "AgentWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" "WalletTxnType" NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(18,4) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'BDT',
    "baseAmount" DECIMAL(18,4) NOT NULL,
    "method" TEXT,
    "reference" TEXT,
    "relatedBookingId" TEXT,
    "isReversed" BOOLEAN NOT NULL DEFAULT false,
    "reversalOfId" TEXT,
    "reversedById" TEXT,
    "postedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "supplierCode" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "contactPerson" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "tradeLicense" TEXT,
    "tin" TEXT,
    "address" TEXT,
    "bankName" TEXT,
    "accountNo" TEXT,
    "routingNo" TEXT,
    "rating" DECIMAL(3,2),
    "status" "SupplierStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierService" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "price" DECIMAL(18,4),
    "currency" "Currency" NOT NULL DEFAULT 'BDT',
    "priceLabel" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "bookingsCount" INTEGER NOT NULL DEFAULT 0,
    "rating" DECIMAL(3,2),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "SupplierService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierInvoice" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "bookingRequestId" TEXT,
    "description" TEXT,
    "amount" DECIMAL(18,4) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'BDT',
    "exchangeRate" DECIMAL(18,8) NOT NULL DEFAULT 1,
    "baseAmount" DECIMAL(18,4) NOT NULL,
    "issueDate" DATE,
    "dueDate" DATE,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "SupplierInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingRequest" (
    "id" TEXT NOT NULL,
    "requestNo" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "bookingId" TEXT,
    "branchId" TEXT,
    "serviceLabel" TEXT,
    "clientLabel" TEXT,
    "property" TEXT,
    "dates" TEXT,
    "rooms" INTEGER,
    "nights" INTEGER,
    "amount" DECIMAL(18,4) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'BDT',
    "baseAmount" DECIMAL(18,4) NOT NULL,
    "status" "BookingRequestStatus" NOT NULL DEFAULT 'PENDING',
    "deadline" TIMESTAMPTZ(6),
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "BookingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CmsPage" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "body" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "metaTitle" TEXT,
    "metaDesc" TEXT,
    "template" TEXT,
    "parentPageId" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "authorId" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "CmsPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Menu" (
    "id" TEXT NOT NULL,
    "location" "MenuLocation" NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "parentId" TEXT,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Slider" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "image" TEXT,
    "ctaText" TEXT,
    "ctaUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Slider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "type" "BannerType" NOT NULL DEFAULT 'PROMO',
    "image" TEXT,
    "linkUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" DATE,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "BlogCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categoryId" TEXT,
    "body" TEXT,
    "excerpt" TEXT,
    "featImg" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "authorName" TEXT,
    "tags" TEXT[],
    "metaTitle" TEXT,
    "metaDesc" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "packageName" TEXT,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "text" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faq" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "MediaType" NOT NULL DEFAULT 'IMAGE',
    "filePath" TEXT NOT NULL,
    "sizeBytes" INTEGER,
    "dimensions" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "type" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorId" TEXT,
    "audience" TEXT,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "branchId" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "channel" "MessageChannel" NOT NULL DEFAULT 'INTERNAL',
    "isGroup" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT,
    "content" TEXT NOT NULL,
    "status" TEXT,
    "attachmentName" TEXT,
    "attachmentSize" INTEGER,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageTemplate" (
    "id" TEXT NOT NULL,
    "channel" "TemplateChannel" NOT NULL,
    "name" TEXT NOT NULL,
    "event" TEXT,
    "content" TEXT,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "MessageTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "ticketNo" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "requesterType" TEXT NOT NULL,
    "requesterId" TEXT,
    "category" TEXT,
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "assignedToId" TEXT,
    "branchId" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "fromId" TEXT,
    "fromLabel" TEXT,
    "body" TEXT NOT NULL,
    "attachment" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "module" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "ip" TEXT,
    "event" TEXT NOT NULL,
    "resource" TEXT,
    "severity" "AuditSeverity" NOT NULL DEFAULT 'INFO',
    "detail" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "group" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentSequence" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "lastValue" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DocumentSequence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Branch_companyId_idx" ON "Branch"("companyId");

-- CreateIndex
CREATE INDEX "Branch_managerId_idx" ON "Branch"("managerId");

-- CreateIndex
CREATE INDEX "User_branchId_idx" ON "User"("branchId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Role_key_key" ON "Role"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");

-- CreateIndex
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- CreateIndex
CREATE INDEX "UserRoleLink_roleId_idx" ON "UserRoleLink"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_userId_key" ON "Customer"("userId");

-- CreateIndex
CREATE INDEX "Customer_branchId_createdAt_idx" ON "Customer"("branchId", "createdAt");

-- CreateIndex
CREATE INDEX "Customer_agentId_idx" ON "Customer"("agentId");

-- CreateIndex
CREATE INDEX "Customer_userId_idx" ON "Customer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CorporateClient_customerId_key" ON "CorporateClient"("customerId");

-- CreateIndex
CREATE INDEX "Lead_branchId_stage_assignedToId_idx" ON "Lead"("branchId", "stage", "assignedToId");

-- CreateIndex
CREATE INDEX "Lead_agentId_idx" ON "Lead"("agentId");

-- CreateIndex
CREATE INDEX "Lead_customerId_idx" ON "Lead"("customerId");

-- CreateIndex
CREATE INDEX "LeadActivity_leadId_createdAt_idx" ON "LeadActivity"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "LeadActivity_actorId_idx" ON "LeadActivity"("actorId");

-- CreateIndex
CREATE INDEX "FollowUp_leadId_idx" ON "FollowUp"("leadId");

-- CreateIndex
CREATE INDEX "FollowUp_assignedToId_done_dueAt_idx" ON "FollowUp"("assignedToId", "done", "dueAt");

-- CreateIndex
CREATE INDEX "CallLog_leadId_createdAt_idx" ON "CallLog"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "CallLog_byId_idx" ON "CallLog"("byId");

-- CreateIndex
CREATE INDEX "Task_assigneeId_status_dueAt_idx" ON "Task"("assigneeId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "Task_relatedBookingId_idx" ON "Task"("relatedBookingId");

-- CreateIndex
CREATE INDEX "Task_relatedLeadId_idx" ON "Task"("relatedLeadId");

-- CreateIndex
CREATE INDEX "Note_leadId_idx" ON "Note"("leadId");

-- CreateIndex
CREATE INDEX "Note_customerId_idx" ON "Note"("customerId");

-- CreateIndex
CREATE INDEX "Note_bookingId_idx" ON "Note"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Service_key_key" ON "Service"("key");

-- CreateIndex
CREATE INDEX "Service_type_idx" ON "Service"("type");

-- CreateIndex
CREATE INDEX "Package_serviceId_idx" ON "Package"("serviceId");

-- CreateIndex
CREATE INDEX "Package_type_status_idx" ON "Package"("type", "status");

-- CreateIndex
CREATE INDEX "PackagePricing_packageId_idx" ON "PackagePricing"("packageId");

-- CreateIndex
CREATE INDEX "PackageItinerary_packageId_idx" ON "PackageItinerary"("packageId");

-- CreateIndex
CREATE INDEX "PackageInclusion_packageId_idx" ON "PackageInclusion"("packageId");

-- CreateIndex
CREATE INDEX "PackageAvailability_departureDate_idx" ON "PackageAvailability"("departureDate");

-- CreateIndex
CREATE UNIQUE INDEX "PackageAvailability_packageId_departureDate_key" ON "PackageAvailability"("packageId", "departureDate");

-- CreateIndex
CREATE INDEX "Booking_branchId_createdAt_idx" ON "Booking"("branchId", "createdAt");

-- CreateIndex
CREATE INDEX "Booking_branchId_serviceType_status_idx" ON "Booking"("branchId", "serviceType", "status");

-- CreateIndex
CREATE INDEX "Booking_agentId_createdAt_idx" ON "Booking"("agentId", "createdAt");

-- CreateIndex
CREATE INDEX "Booking_customerId_createdAt_idx" ON "Booking"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "Booking_packageId_idx" ON "Booking"("packageId");

-- CreateIndex
CREATE INDEX "Booking_assignedStaffId_idx" ON "Booking"("assignedStaffId");

-- CreateIndex
CREATE UNIQUE INDEX "HajjBooking_bookingId_key" ON "HajjBooking"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "UmrahBooking_bookingId_key" ON "UmrahBooking"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "VisaBooking_bookingId_key" ON "VisaBooking"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "AirTicketBooking_bookingId_key" ON "AirTicketBooking"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "HotelBooking_bookingId_key" ON "HotelBooking"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "ManpowerBooking_bookingId_key" ON "ManpowerBooking"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "TourBooking_bookingId_key" ON "TourBooking"("bookingId");

-- CreateIndex
CREATE INDEX "Traveler_bookingId_idx" ON "Traveler"("bookingId");

-- CreateIndex
CREATE INDEX "Traveler_mahramOfId_idx" ON "Traveler"("mahramOfId");

-- CreateIndex
CREATE INDEX "Document_status_expiryAt_idx" ON "Document"("status", "expiryAt");

-- CreateIndex
CREATE INDEX "Document_ownerType_bookingId_idx" ON "Document"("ownerType", "bookingId");

-- CreateIndex
CREATE INDEX "Document_travelerId_idx" ON "Document"("travelerId");

-- CreateIndex
CREATE INDEX "Document_customerId_idx" ON "Document"("customerId");

-- CreateIndex
CREATE INDEX "Document_supplierId_idx" ON "Document"("supplierId");

-- CreateIndex
CREATE INDEX "BookingCharge_bookingId_idx" ON "BookingCharge"("bookingId");

-- CreateIndex
CREATE INDEX "BookingStageEvent_bookingId_createdAt_idx" ON "BookingStageEvent"("bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "BookingActivity_bookingId_createdAt_idx" ON "BookingActivity"("bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "Invoice_branchId_issueDate_idx" ON "Invoice"("branchId", "issueDate");

-- CreateIndex
CREATE INDEX "Invoice_customerId_issueDate_idx" ON "Invoice"("customerId", "issueDate");

-- CreateIndex
CREATE INDEX "Invoice_status_dueDate_idx" ON "Invoice"("status", "dueDate");

-- CreateIndex
CREATE INDEX "Invoice_bookingId_idx" ON "Invoice"("bookingId");

-- CreateIndex
CREATE INDEX "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_reversalOfId_key" ON "Payment"("reversalOfId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_reversedById_key" ON "Payment"("reversedById");

-- CreateIndex
CREATE INDEX "Payment_branchId_paidAt_idx" ON "Payment"("branchId", "paidAt");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- CreateIndex
CREATE INDEX "Payment_customerId_idx" ON "Payment"("customerId");

-- CreateIndex
CREATE INDEX "Payment_supplierId_idx" ON "Payment"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_receiptNo_key" ON "Receipt"("receiptNo");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_paymentId_key" ON "Receipt"("paymentId");

-- CreateIndex
CREATE INDEX "Receipt_branchId_issuedAt_idx" ON "Receipt"("branchId", "issuedAt");

-- CreateIndex
CREATE UNIQUE INDEX "InstallmentPlan_invoiceId_key" ON "InstallmentPlan"("invoiceId");

-- CreateIndex
CREATE INDEX "InstallmentPlan_branchId_idx" ON "InstallmentPlan"("branchId");

-- CreateIndex
CREATE INDEX "InstallmentPlan_bookingId_idx" ON "InstallmentPlan"("bookingId");

-- CreateIndex
CREATE INDEX "InstallmentPlan_customerId_idx" ON "InstallmentPlan"("customerId");

-- CreateIndex
CREATE INDEX "Installment_status_dueDate_idx" ON "Installment"("status", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Installment_planId_number_key" ON "Installment"("planId", "number");

-- CreateIndex
CREATE INDEX "Refund_branchId_createdAt_idx" ON "Refund"("branchId", "createdAt");

-- CreateIndex
CREATE INDEX "Refund_invoiceId_idx" ON "Refund"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_code_key" ON "Account"("code");

-- CreateIndex
CREATE INDEX "Account_parentId_idx" ON "Account"("parentId");

-- CreateIndex
CREATE INDEX "Account_accountClass_idx" ON "Account"("accountClass");

-- CreateIndex
CREATE INDEX "BankAccount_coaAccountId_idx" ON "BankAccount"("coaAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_ref_key" ON "JournalEntry"("ref");

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_reversalOfId_key" ON "JournalEntry"("reversalOfId");

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_reversedById_key" ON "JournalEntry"("reversedById");

-- CreateIndex
CREATE INDEX "JournalEntry_branchId_date_idx" ON "JournalEntry"("branchId", "date");

-- CreateIndex
CREATE INDEX "JournalEntry_status_idx" ON "JournalEntry"("status");

-- CreateIndex
CREATE INDEX "JournalLine_entryId_idx" ON "JournalLine"("entryId");

-- CreateIndex
CREATE INDEX "JournalLine_accountId_idx" ON "JournalLine"("accountId");

-- CreateIndex
CREATE INDEX "Expense_branchId_date_idx" ON "Expense"("branchId", "date");

-- CreateIndex
CREATE INDEX "Expense_category_idx" ON "Expense"("category");

-- CreateIndex
CREATE INDEX "Income_branchId_date_idx" ON "Income"("branchId", "date");

-- CreateIndex
CREATE INDEX "Income_category_idx" ON "Income"("category");

-- CreateIndex
CREATE INDEX "SupplierPayable_branchId_status_dueDate_idx" ON "SupplierPayable"("branchId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "SupplierPayable_supplierId_idx" ON "SupplierPayable"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_userId_key" ON "Agent"("userId");

-- CreateIndex
CREATE INDEX "Agent_parentAgentId_idx" ON "Agent"("parentAgentId");

-- CreateIndex
CREATE INDEX "Agent_branchId_idx" ON "Agent"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "CommissionTier_tier_key" ON "CommissionTier"("tier");

-- CreateIndex
CREATE INDEX "AgentCommission_agentId_period_idx" ON "AgentCommission"("agentId", "period");

-- CreateIndex
CREATE INDEX "AgentCommission_bookingId_idx" ON "AgentCommission"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentWallet_agentId_key" ON "AgentWallet"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "WalletTransaction_reversalOfId_key" ON "WalletTransaction"("reversalOfId");

-- CreateIndex
CREATE UNIQUE INDEX "WalletTransaction_reversedById_key" ON "WalletTransaction"("reversedById");

-- CreateIndex
CREATE INDEX "WalletTransaction_walletId_postedAt_idx" ON "WalletTransaction"("walletId", "postedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_userId_key" ON "Supplier"("userId");

-- CreateIndex
CREATE INDEX "SupplierService_supplierId_idx" ON "SupplierService"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierInvoice_supplierId_idx" ON "SupplierInvoice"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierInvoice_bookingRequestId_idx" ON "SupplierInvoice"("bookingRequestId");

-- CreateIndex
CREATE INDEX "BookingRequest_supplierId_status_idx" ON "BookingRequest"("supplierId", "status");

-- CreateIndex
CREATE INDEX "BookingRequest_bookingId_idx" ON "BookingRequest"("bookingId");

-- CreateIndex
CREATE INDEX "CmsPage_parentPageId_idx" ON "CmsPage"("parentPageId");

-- CreateIndex
CREATE UNIQUE INDEX "Menu_location_key" ON "Menu"("location");

-- CreateIndex
CREATE INDEX "MenuItem_menuId_idx" ON "MenuItem"("menuId");

-- CreateIndex
CREATE INDEX "MenuItem_parentId_idx" ON "MenuItem"("parentId");

-- CreateIndex
CREATE INDEX "BlogPost_categoryId_idx" ON "BlogPost"("categoryId");

-- CreateIndex
CREATE INDEX "BlogPost_status_publishedAt_idx" ON "BlogPost"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "Faq_category_idx" ON "Faq"("category");

-- CreateIndex
CREATE INDEX "Notification_userId_read_createdAt_idx" ON "Notification"("userId", "read", "createdAt");

-- CreateIndex
CREATE INDEX "Announcement_pinned_createdAt_idx" ON "Announcement"("pinned", "createdAt");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "MessageTemplate_channel_idx" ON "MessageTemplate"("channel");

-- CreateIndex
CREATE INDEX "SupportTicket_status_priority_idx" ON "SupportTicket"("status", "priority");

-- CreateIndex
CREATE INDEX "SupportTicket_requesterType_requesterId_idx" ON "SupportTicket"("requesterType", "requesterId");

-- CreateIndex
CREATE INDEX "TicketMessage_ticketId_createdAt_idx" ON "TicketMessage"("ticketId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_module_createdAt_idx" ON "ActivityLog"("module", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_createdAt_idx" ON "ActivityLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_resource_createdAt_idx" ON "AuditLog"("resource", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_severity_idx" ON "AuditLog"("severity");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_companyId_key_key" ON "Setting"("companyId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentSequence_scope_branchId_year_key" ON "DocumentSequence"("scope", "branchId", "year");

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoleLink" ADD CONSTRAINT "UserRoleLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoleLink" ADD CONSTRAINT "UserRoleLink_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateClient" ADD CONSTRAINT "CorporateClient_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_byId_fkey" FOREIGN KEY ("byId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_relatedBookingId_fkey" FOREIGN KEY ("relatedBookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_relatedLeadId_fkey" FOREIGN KEY ("relatedLeadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackagePricing" ADD CONSTRAINT "PackagePricing_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageItinerary" ADD CONSTRAINT "PackageItinerary_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageInclusion" ADD CONSTRAINT "PackageInclusion_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageAvailability" ADD CONSTRAINT "PackageAvailability_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HajjBooking" ADD CONSTRAINT "HajjBooking_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UmrahBooking" ADD CONSTRAINT "UmrahBooking_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisaBooking" ADD CONSTRAINT "VisaBooking_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AirTicketBooking" ADD CONSTRAINT "AirTicketBooking_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelBooking" ADD CONSTRAINT "HotelBooking_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManpowerBooking" ADD CONSTRAINT "ManpowerBooking_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourBooking" ADD CONSTRAINT "TourBooking_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Traveler" ADD CONSTRAINT "Traveler_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Traveler" ADD CONSTRAINT "Traveler_mahramOfId_fkey" FOREIGN KEY ("mahramOfId") REFERENCES "Traveler"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "Traveler"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingCharge" ADD CONSTRAINT "BookingCharge_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingStageEvent" ADD CONSTRAINT "BookingStageEvent_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingStageEvent" ADD CONSTRAINT "BookingStageEvent_byId_fkey" FOREIGN KEY ("byId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingActivity" ADD CONSTRAINT "BookingActivity_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingActivity" ADD CONSTRAINT "BookingActivity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_reversalOfId_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallmentPlan" ADD CONSTRAINT "InstallmentPlan_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallmentPlan" ADD CONSTRAINT "InstallmentPlan_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Installment" ADD CONSTRAINT "Installment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "InstallmentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_coaAccountId_fkey" FOREIGN KEY ("coaAccountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_reversalOfId_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "JournalEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "JournalEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Income" ADD CONSTRAINT "Income_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierPayable" ADD CONSTRAINT "SupplierPayable_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierPayable" ADD CONSTRAINT "SupplierPayable_supplierInvoiceId_fkey" FOREIGN KEY ("supplierInvoiceId") REFERENCES "SupplierInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_parentAgentId_fkey" FOREIGN KEY ("parentAgentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentCommission" ADD CONSTRAINT "AgentCommission_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentCommission" ADD CONSTRAINT "AgentCommission_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentWallet" ADD CONSTRAINT "AgentWallet_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "AgentWallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_reversalOfId_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "WalletTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierService" ADD CONSTRAINT "SupplierService_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierInvoice" ADD CONSTRAINT "SupplierInvoice_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierInvoice" ADD CONSTRAINT "SupplierInvoice_bookingRequestId_fkey" FOREIGN KEY ("bookingRequestId") REFERENCES "BookingRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingRequest" ADD CONSTRAINT "BookingRequest_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingRequest" ADD CONSTRAINT "BookingRequest_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CmsPage" ADD CONSTRAINT "CmsPage_parentPageId_fkey" FOREIGN KEY ("parentPageId") REFERENCES "CmsPage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BlogCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Setting" ADD CONSTRAINT "Setting_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
