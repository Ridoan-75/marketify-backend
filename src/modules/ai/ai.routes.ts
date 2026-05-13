import { Router } from "express";
import {
  generateDescription,
  pricingSuggestion,
  analyzeReview,
  smartSearch,
  chatbot,
  getRecommendations,
} from "./ai.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
  generateDescriptionSchema,
  pricingSuggestionSchema,
  smartSearchSchema,
  chatbotSchema,
} from "./ai.validation";

const aiRouter = Router();

// public
aiRouter.get("/search", validate(smartSearchSchema), smartSearch);

// authenticated
aiRouter.use(authenticate);

aiRouter.get("/recommendations", getRecommendations);
aiRouter.post("/chatbot", validate(chatbotSchema), chatbot);

// seller only
aiRouter.post(
  "/description",
  authorize("SELLER"),
  validate(generateDescriptionSchema),
  generateDescription,
);

aiRouter.post(
  "/pricing",
  authorize("SELLER"),
  validate(pricingSuggestionSchema),
  pricingSuggestion,
);

// admin only
aiRouter.post("/review/:reviewId/analyze", authorize("ADMIN"), analyzeReview);

export { aiRouter };
