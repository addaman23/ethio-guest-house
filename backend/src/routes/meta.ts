import { Router } from "express";
import { config } from "../config";
import { ETB_REFERENCE_RATES, GUEST_COUNTRIES } from "../utils/international";

const router = Router();

router.get("/international", (_req, res) => {
  res.json({
    message:
      "Welcome international guests. Browse photos, request a stay, and pay in ETB on arrival after host approval.",
    countries: GUEST_COUNTRIES,
    etbReferenceRates: ETB_REFERENCE_RATES,
    platformCommissionRate: config.platformCommissionRate,
    platformCommissionPercent: Math.round(config.platformCommissionRate * 100),
    paymentNote:
      "Prices are shown in Ethiopian Birr (ETB). Reference amounts in USD, CAD, EUR, and GBP are estimates only.",
    platformNote: `AddisAbaba Guest House charges hosts a ${Math.round(config.platformCommissionRate * 100)}% fee on rent for connecting guests with guest houses.`,
  });
});

export default router;
