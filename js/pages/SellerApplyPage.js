// Legacy compatibility bridge.
// The old single-page seller application UI is permanently retired.
// Keep this module path so existing imports remain compatible, but always
// render/use the stable five-step onboarding implementation.
export {
  renderSellerApplyPage,
  initSellerApplyEvents
} from './SellerApplyQuickPage.js';
