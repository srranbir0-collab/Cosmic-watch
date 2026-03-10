
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppError } from './utils/AppError';
import * as asteroidController from './controllers/asteroid.controller';
import * as riskController from './controllers/risk.controller';
import * as authController from './controllers/auth.controller';
import * as chatController from './controllers/chat.controller';
import * as adminController from './controllers/admin.controller';
import { protect } from './middleware/auth.middleware';
import logger from './utils/logger';
import path from 'path';
import fs from 'fs';
import { Buffer } from 'buffer';
import process from 'process';

// AI Integration imports
import { GoogleGenAI, Type } from "@google/genai";
import fetch from 'node-fetch';

const app = express();

// --- Middleware ---
app.use(helmet({ 
  contentSecurityPolicy: false, 
}) as any); 
app.use(cors({
  origin: true,
  credentials: true,
}) as any);
app.use(compression() as any);
app.use(cookieParser() as any);
app.use(express.json({ limit: '50mb' }) as any);
app.use(express.urlencoded({ limit: '50mb', extended: true }) as any);

// Request Logger
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${(req as any).method} ${(req as any).originalUrl}`);
  next();
});

// --- Health Check ---
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// --- API Routes ---

const apiRouter = express.Router();

// Auth Endpoints
apiRouter.post('/auth/register', authController.authLimiter as any, authController.register);
apiRouter.post('/auth/login', authController.authLimiter as any, authController.login);
apiRouter.post('/auth/logout', authController.logout);
apiRouter.post('/auth/refresh', authController.refresh);
apiRouter.get('/auth/verify', protect, authController.verify);
apiRouter.post('/auth/onboarding', protect, authController.completeOnboarding);
apiRouter.post('/auth/invite', protect, authController.inviteUser);

// Admin Endpoints
apiRouter.get('/admin/users', protect, adminController.getUsers);
apiRouter.post('/admin/impersonate', protect, adminController.impersonateUser);

// Asteroid Endpoints
apiRouter.get('/asteroids/feed', protect, asteroidController.getFeed);
apiRouter.get('/asteroids/search', protect, asteroidController.searchAsteroids);
apiRouter.get('/asteroids/stats', protect, asteroidController.getStats);
apiRouter.get('/asteroids/approaching', protect, asteroidController.getApproaching);
apiRouter.get('/asteroids/:id', protect, asteroidController.getAsteroid);

// Risk Analysis Endpoint
apiRouter.get('/risk-analysis/:asteroidId', protect, riskController.getRiskAnalysis);

// Chat Endpoint
apiRouter.get('/chat/:asteroidId', protect, chatController.getHistory);

// Legacy/Frontend Support Endpoints
apiRouter.get('/neos', protect, asteroidController.getFeed); 

// --- AI & Video Endpoints ---

// Helper to get AI instance safely
const getAI = () => {
    const key = process.env.API_KEY;
    if (!key) throw new AppError('Server misconfiguration: API_KEY missing', 500);
    return new GoogleGenAI({ apiKey: key });
};

apiRouter.post('/analyze', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { neo } = (req as any).body;
    if (!neo) throw new AppError('NEO data required', 400);

    const ai = getAI();
    const diameter = neo.estimated_diameter?.meters?.estimated_diameter_max || 0;
    const velocity = neo.close_approach_data?.[0]?.relative_velocity?.kilometers_per_hour || 0;
    const prompt = `Analyze risk of NEO "${neo.name}". Diameter: ${diameter}m. Velocity: ${velocity}km/h. Hazardous: ${neo.is_potentially_hazardous_asteroid}. Return JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                impactProbability: { type: Type.STRING },
                kineticEnergy: { type: Type.STRING },
                potentialDamage: { type: Type.STRING },
                summary: { type: Type.STRING },
                dangerLevel: { type: Type.STRING, enum: ["LOW", "MODERATE", "HIGH", "EXTREME"] }
            }
        }
      }
    });

    if (response.text) {
        const result = JSON.parse(response.text);
        return (res as any).json(result);
    }
    throw new AppError('AI Model returned empty response', 500);
  } catch (error) {
    next(error);
  }
});

apiRouter.post('/animate', protect, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { image, prompt, aspectRatio } = (req as any).body;
        if (!image) throw new AppError('Image required', 400);

        const ai = getAI();
        const base64Data = image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
        let mimeType = 'image/png';
        if (image.startsWith('data:image/jpeg')) mimeType = 'image/jpeg';

        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt || "Cinematic shot",
            image: { imageBytes: base64Data, mimeType },
            config: { numberOfVideos: 1, resolution: '720p', aspectRatio: aspectRatio || '16:9' }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) throw new AppError('Video generation failed', 500);

        const videoRes = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const videoBuffer = await videoRes.arrayBuffer();

        (res as any).set('Content-Type', 'video/mp4');
        (res as any).send(Buffer.from(videoBuffer));
    } catch (error) {
        next(error);
    }
});

apiRouter.post('/edit-image', protect, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { image, prompt } = (req as any).body;
        if (!image || !prompt) throw new AppError('Image and prompt required', 400);

        const ai = getAI();
        const base64Data = image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
        const mimeType = image.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] || 'image/png';

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64Data } },
                    { text: prompt }
                ]
            }
        });

        let outputImageBase64 = null;
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    outputImageBase64 = part.inlineData.data;
                    break;
                }
            }
        }

        if (outputImageBase64) {
             const buffer = Buffer.from(outputImageBase64, 'base64');
             (res as any).set('Content-Type', 'image/png');
             (res as any).send(buffer);
        } else {
             const text = response.text || 'Failed to edit image';
             throw new AppError(text, 400);
        }
    } catch (error) {
        next(error);
    }
});

app.use('/api', apiRouter);

// --- STATIC FILE SERVING ---
// Robustly check if dist exists, regardless of NODE_ENV
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  logger.info('Serving static assets from ' + distPath);
  app.use(express.static(distPath) as any);
  
  app.get('*', (req: any, res: any) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  logger.warn('⚠️ DIST FOLDER NOT FOUND. Frontend will not be served.');
}

// --- Global Error Handler ---
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(err);

  if (err instanceof AppError) {
    (res as any).status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    return;
  }

  (res as any).status(500).json({
    status: 'error',
    message: 'Internal Server Error',
  });
});

export { app };
