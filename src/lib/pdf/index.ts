/**
 * PDF engine — Template A (foldable emergency wallet card) and Template B
 * (clinical daily intake schedule). Everything renders client-side with
 * jsPDF + jspdf-autotable; nothing is uploaded anywhere.
 */
export { generateWalletCardPdf, type WalletCardOptions } from './walletCard';
export { generateDailyIntakePdf, type DailyIntakeOptions } from './dailyIntake';
export { qrCodeDataUrl, emergencyQrCodeDataUrl } from './qr';
export { CARD_WIDTH_IN, CARD_HEIGHT_IN, type PageFormat, pageSizeIn } from './layout';
