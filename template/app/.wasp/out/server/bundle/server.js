import http from 'http';
import express, { Router } from 'express';
import * as z from 'zod';
import { z as z$1 } from 'zod';
import { PrismaClient, Prisma } from '@prisma/client';
import { Lucia } from 'lucia';
import { PrismaAdapter } from '@lucia-auth/adapter-prisma';
import { verify, hash } from '@node-rs/argon2';
import { registerCustom, deserialize, serialize } from 'superjson';
import OpenAI from 'openai';
import Stripe from 'stripe';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { S3Client, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { PDFDocument } from 'pdf-lib';
import PgBoss from 'pg-boss';
import Lob from 'lob';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import * as jwt from 'oslo/jwt';
import { TimeSpan } from 'oslo';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

const colors = {
  red: "\x1B[31m",
  yellow: "\x1B[33m"
};
const resetColor = "\x1B[0m";
function getColorizedConsoleFormatString(colorKey) {
  const color = colors[colorKey];
  return `${color}%s${resetColor}`;
}

const redColorFormatString = getColorizedConsoleFormatString("red");
function ensureEnvSchema(data, schema) {
  const result = getValidatedEnvOrError(data, schema);
  if (result.success) {
    return result.data;
  } else {
    console.error(`${redColorFormatString}${formatZodEnvErrors(result.error.issues)}`);
    throw new Error("Error parsing environment variables");
  }
}
function getValidatedEnvOrError(env, schema) {
  return schema.safeParse(env);
}
function formatZodEnvErrors(issues) {
  const errorOutput = ["", "\u2550\u2550 Env vars validation failed \u2550\u2550", ""];
  for (const error of issues) {
    errorOutput.push(` - ${error.message}`);
  }
  errorOutput.push("");
  errorOutput.push("\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550");
  return errorOutput.join("\n");
}

const userServerEnvSchema = z.object({});
const waspServerCommonSchema = z.object({
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string({
    required_error: "DATABASE_URL is required"
  }),
  PG_BOSS_NEW_OPTIONS: z.string().optional(),
  SKIP_EMAIL_VERIFICATION_IN_DEV: z.enum(["true", "false"], {
    message: 'SKIP_EMAIL_VERIFICATION_IN_DEV must be either "true" or "false"'
  }).transform((value) => value === "true").default("false")
});
const serverUrlSchema = z.string({
  required_error: "WASP_SERVER_URL is required"
}).url({
  message: "WASP_SERVER_URL must be a valid URL"
});
const clientUrlSchema = z.string({
  required_error: "WASP_WEB_CLIENT_URL is required"
}).url({
  message: "WASP_WEB_CLIENT_URL must be a valid URL"
});
const jwtTokenSchema = z.string({
  required_error: "JWT_SECRET is required"
});
const serverDevSchema = z.object({
  NODE_ENV: z.literal("development"),
  "WASP_SERVER_URL": serverUrlSchema.default("http://localhost:3001"),
  "WASP_WEB_CLIENT_URL": clientUrlSchema.default("http://localhost:3000/"),
  "JWT_SECRET": jwtTokenSchema.default("DEVJWTSECRET")
});
const serverProdSchema = z.object({
  NODE_ENV: z.literal("production"),
  "WASP_SERVER_URL": serverUrlSchema,
  "WASP_WEB_CLIENT_URL": clientUrlSchema,
  "JWT_SECRET": jwtTokenSchema
});
const serverCommonSchema = userServerEnvSchema.merge(waspServerCommonSchema);
const serverEnvSchema = z.discriminatedUnion("NODE_ENV", [
  serverDevSchema.merge(serverCommonSchema),
  serverProdSchema.merge(serverCommonSchema)
]);
const env = ensureEnvSchema({ NODE_ENV: serverDevSchema.shape.NODE_ENV.value, ...process.env }, serverEnvSchema);

function stripTrailingSlash(url) {
  return url?.replace(/\/$/, "");
}

const frontendUrl = stripTrailingSlash(env["WASP_WEB_CLIENT_URL"]);
stripTrailingSlash(env["WASP_SERVER_URL"]);
const allowedCORSOriginsPerEnv = {
  development: "*",
  production: [frontendUrl]
};
const allowedCORSOrigins = allowedCORSOriginsPerEnv[env.NODE_ENV];
const config$1 = {
  frontendUrl,
  allowedCORSOrigins,
  env: env.NODE_ENV,
  isDevelopment: env.NODE_ENV === "development",
  port: env.PORT,
  databaseUrl: env.DATABASE_URL,
  auth: {
    jwtSecret: env["JWT_SECRET"]
  }
};

function createDbClient() {
  return new PrismaClient();
}
const dbClient = createDbClient();

class HttpError extends Error {
  statusCode;
  data;
  constructor(statusCode, message, data, options) {
    super(message, options);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, HttpError);
    }
    this.name = this.constructor.name;
    if (!(Number.isInteger(statusCode) && statusCode >= 400 && statusCode < 600)) {
      throw new Error("statusCode has to be integer in range [400, 600).");
    }
    this.statusCode = statusCode;
    if (data) {
      this.data = data;
    }
  }
}

const prismaAdapter = new PrismaAdapter(dbClient.session, dbClient.auth);
const auth$1 = new Lucia(prismaAdapter, {
  // Since we are not using cookies, we don't need to set any cookie options.
  // But in the future, if we decide to use cookies, we can set them here.
  // sessionCookie: {
  //   name: "session",
  //   expires: true,
  //   attributes: {
  //     secure: !config.isDevelopment,
  //     sameSite: "lax",
  //   },
  // },
  getUserAttributes({ userId }) {
    return {
      userId
    };
  }
});

const hashingOptions = {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
  version: 1
};
async function hashPassword(password) {
  return hash(normalizePassword(password), hashingOptions);
}
async function verifyPassword(hashedPassword, password) {
  const validPassword = await verify(hashedPassword, normalizePassword(password), hashingOptions);
  if (!validPassword) {
    throw new Error("Invalid password");
  }
}
function normalizePassword(password) {
  return password.normalize("NFKC");
}

const defineHandler = (middleware) => middleware;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PASSWORD_FIELD = "password";
const EMAIL_FIELD = "email";
const TOKEN_FIELD = "token";
function ensureValidEmail(args) {
  validate(args, [
    { validates: EMAIL_FIELD, message: "email must be present", validator: (email) => !!email },
    { validates: EMAIL_FIELD, message: "email must be a valid email", validator: (email) => isValidEmail(email) }
  ]);
}
function ensurePasswordIsPresent(args) {
  validate(args, [
    { validates: PASSWORD_FIELD, message: "password must be present", validator: (password) => !!password }
  ]);
}
function ensureValidPassword(args) {
  validate(args, [
    { validates: PASSWORD_FIELD, message: "password must be at least 8 characters", validator: (password) => isMinLength(password, 8) },
    { validates: PASSWORD_FIELD, message: "password must contain a number", validator: (password) => containsNumber(password) }
  ]);
}
function ensureTokenIsPresent(args) {
  validate(args, [
    { validates: TOKEN_FIELD, message: "token must be present", validator: (token) => !!token }
  ]);
}
function throwValidationError(message) {
  throw new HttpError(422, "Validation failed", { message });
}
function validate(args, validators) {
  for (const { validates, message, validator } of validators) {
    if (!validator(args[validates])) {
      throwValidationError(message);
    }
  }
}
const validEmailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
function isValidEmail(input) {
  if (typeof input !== "string") {
    return false;
  }
  return input.match(validEmailRegex) !== null;
}
function isMinLength(input, minLength) {
  if (typeof input !== "string") {
    return false;
  }
  return input.length >= minLength;
}
function containsNumber(input) {
  if (typeof input !== "string") {
    return false;
  }
  return /\d/.test(input);
}

({
  entities: {
    User: dbClient.user
  }
});
function createProviderId(providerName, providerUserId) {
  return {
    providerName,
    providerUserId: normalizeProviderUserId(providerName, providerUserId)
  };
}
function normalizeProviderUserId(providerName, providerUserId) {
  switch (providerName) {
    case "email":
    case "username":
      return providerUserId.toLowerCase();
    case "google":
    case "github":
    case "discord":
    case "keycloak":
    case "slack":
      return providerUserId;
    /*
          Why the default case?
          In case users add a new auth provider in the user-land.
          Users can't extend this function because it is private.
          If there is an unknown `providerName` in runtime, we'll
          return the `providerUserId` as is.
    
          We want to still have explicit OAuth providers listed
          so that we get a type error if we forget to add a new provider
          to the switch statement.
        */
    default:
      return providerUserId;
  }
}
async function findAuthIdentity(providerId) {
  return dbClient.authIdentity.findUnique({
    where: {
      providerName_providerUserId: providerId
    }
  });
}
async function updateAuthIdentityProviderData(providerId, existingProviderData, providerDataUpdates) {
  const sanitizedProviderDataUpdates = await ensurePasswordIsHashed(providerDataUpdates);
  const newProviderData = {
    ...existingProviderData,
    ...sanitizedProviderDataUpdates
  };
  const serializedProviderData = await serializeProviderData(newProviderData);
  return dbClient.authIdentity.update({
    where: {
      providerName_providerUserId: providerId
    },
    data: { providerData: serializedProviderData }
  });
}
async function findAuthWithUserBy(where) {
  const result = await dbClient.auth.findFirst({ where, include: { user: true } });
  if (result === null) {
    return null;
  }
  if (result.user === null) {
    return null;
  }
  return { ...result, user: result.user };
}
async function createUser(providerId, serializedProviderData, userFields) {
  return dbClient.user.create({
    data: {
      // Using any here to prevent type errors when userFields are not
      // defined. We want Prisma to throw an error in that case.
      ...userFields ?? {},
      auth: {
        create: {
          identities: {
            create: {
              providerName: providerId.providerName,
              providerUserId: providerId.providerUserId,
              providerData: serializedProviderData
            }
          }
        }
      }
    },
    // We need to include the Auth entity here because we need `authId`
    // to be able to create a session.
    include: {
      auth: true
    }
  });
}
async function deleteUserByAuthId(authId) {
  return dbClient.user.deleteMany({ where: { auth: {
    id: authId
  } } });
}
async function doFakeWork() {
  const timeToWork = Math.floor(Math.random() * 1e3) + 1e3;
  return sleep(timeToWork);
}
function rethrowPossibleAuthError(e) {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    throw new HttpError(422, "Save failed", {
      message: `user with the same identity already exists`
    });
  }
  if (e instanceof Prisma.PrismaClientValidationError) {
    console.error(e);
    throw new HttpError(422, "Save failed", {
      message: "there was a database error"
    });
  }
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2021") {
    console.error(e);
    console.info("\u{1F41D} This error can happen if you did't run the database migrations.");
    throw new HttpError(500, "Save failed", {
      message: `there was a database error`
    });
  }
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
    console.error(e);
    console.info(`\u{1F41D} This error can happen if you have some relation on your User entity
   but you didn't specify the "onDelete" behaviour to either "Cascade" or "SetNull".
   Read more at: https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/referential-actions`);
    throw new HttpError(500, "Save failed", {
      message: `there was a database error`
    });
  }
  throw e;
}
async function validateAndGetUserFields(data, userSignupFields) {
  const { password: _password, ...sanitizedData } = data;
  const result = {};
  if (!userSignupFields) {
    return result;
  }
  for (const [field, getFieldValue] of Object.entries(userSignupFields)) {
    try {
      const value = await getFieldValue(sanitizedData);
      result[field] = value;
    } catch (e) {
      throwValidationError(e.message);
    }
  }
  return result;
}
function getProviderData(providerData) {
  return sanitizeProviderData(getProviderDataWithPassword(providerData));
}
function getProviderDataWithPassword(providerData) {
  return JSON.parse(providerData);
}
function sanitizeProviderData(providerData) {
  if (providerDataHasPasswordField(providerData)) {
    const { hashedPassword, ...rest } = providerData;
    return rest;
  } else {
    return providerData;
  }
}
async function sanitizeAndSerializeProviderData(providerData) {
  return serializeProviderData(await ensurePasswordIsHashed(providerData));
}
function serializeProviderData(providerData) {
  return JSON.stringify(providerData);
}
async function ensurePasswordIsHashed(providerData) {
  const data = {
    ...providerData
  };
  if (providerDataHasPasswordField(data)) {
    data.hashedPassword = await hashPassword(data.hashedPassword);
  }
  return data;
}
function providerDataHasPasswordField(providerData) {
  return "hashedPassword" in providerData;
}
function createInvalidCredentialsError(message) {
  return new HttpError(401, "Invalid credentials", { message });
}

function createAuthUserData(user) {
  const { auth, ...rest } = user;
  if (!auth) {
    throw new Error(`\u{1F41D} Error: trying to create a user without auth data.
This should never happen, but it did which means there is a bug in the code.`);
  }
  const identities = {
    email: getProviderInfo(auth, "email")
  };
  return {
    ...rest,
    identities
  };
}
function getProviderInfo(auth, providerName) {
  const identity = getIdentity(auth, providerName);
  if (!identity) {
    return null;
  }
  return {
    ...getProviderData(identity.providerData),
    id: identity.providerUserId
  };
}
function getIdentity(auth, providerName) {
  return auth.identities.find((i) => i.providerName === providerName) ?? null;
}

async function createSession(authId) {
  return auth$1.createSession(authId, {});
}
async function getSessionAndUserFromBearerToken(req) {
  const authorizationHeader = req.headers["authorization"];
  if (typeof authorizationHeader !== "string") {
    return null;
  }
  const sessionId = auth$1.readBearerToken(authorizationHeader);
  if (!sessionId) {
    return null;
  }
  return getSessionAndUserFromSessionId(sessionId);
}
async function getSessionAndUserFromSessionId(sessionId) {
  const { session, user: authEntity } = await auth$1.validateSession(sessionId);
  if (!session || !authEntity) {
    return null;
  }
  return {
    session,
    user: await getAuthUserData(authEntity.userId)
  };
}
async function getAuthUserData(userId) {
  const user = await dbClient.user.findUnique({
    where: { id: userId },
    include: {
      auth: {
        include: {
          identities: true
        }
      }
    }
  });
  if (!user) {
    throw createInvalidCredentialsError();
  }
  return createAuthUserData(user);
}
function invalidateSession(sessionId) {
  return auth$1.invalidateSession(sessionId);
}

const auth = defineHandler(async (req, res, next) => {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    req.sessionId = null;
    req.user = null;
    return next();
  }
  const sessionAndUser = await getSessionAndUserFromBearerToken(req);
  if (sessionAndUser === null) {
    throw createInvalidCredentialsError();
  }
  req.sessionId = sessionAndUser.session.id;
  req.user = sessionAndUser.user;
  next();
});

const Decimal = Prisma.Decimal;
if (Decimal) {
  registerCustom({
    isApplicable: (v) => Decimal.isDecimal(v),
    serialize: (v) => v.toJSON(),
    deserialize: (v) => new Decimal(v)
  }, "prisma.decimal");
}

function isNotNull(value) {
  return value !== null;
}

function makeAuthUserIfPossible(user) {
  return user ? makeAuthUser(user) : null;
}
function makeAuthUser(data) {
  return {
    ...data,
    getFirstProviderUserId: () => {
      const identities = Object.values(data.identities).filter(isNotNull);
      return identities.length > 0 ? identities[0].id : null;
    }
  };
}

function createOperation(handlerFn) {
  return defineHandler(async (req, res) => {
    const args = req.body && deserialize(req.body) || {};
    const context = {
      user: makeAuthUserIfPossible(req.user)
    };
    const result = await handlerFn(args, context);
    const serializedResult = serialize(result);
    res.json(serializedResult);
  });
}
function createQuery(handlerFn) {
  return createOperation(handlerFn);
}
function createAction(handlerFn) {
  return createOperation(handlerFn);
}

function requireNodeEnvVar(name) {
  const value = process.env[name];
  if (value === void 0) {
    throw new Error(`Env var ${name} is undefined`);
  } else {
    return value;
  }
}

var SubscriptionStatus = /* @__PURE__ */ ((SubscriptionStatus2) => {
  SubscriptionStatus2["PastDue"] = "past_due";
  SubscriptionStatus2["CancelAtPeriodEnd"] = "cancel_at_period_end";
  SubscriptionStatus2["Active"] = "active";
  SubscriptionStatus2["Deleted"] = "deleted";
  return SubscriptionStatus2;
})(SubscriptionStatus || {});
var PaymentPlanId = /* @__PURE__ */ ((PaymentPlanId2) => {
  PaymentPlanId2["Hobby"] = "hobby";
  PaymentPlanId2["Pro"] = "pro";
  PaymentPlanId2["Credits10"] = "credits10";
  return PaymentPlanId2;
})(PaymentPlanId || {});
const paymentPlans = {
  ["hobby" /* Hobby */]: {
    getPaymentProcessorPlanId: () => requireNodeEnvVar("PAYMENTS_HOBBY_SUBSCRIPTION_PLAN_ID"),
    effect: { kind: "subscription" }
  },
  ["pro" /* Pro */]: {
    getPaymentProcessorPlanId: () => requireNodeEnvVar("PAYMENTS_PRO_SUBSCRIPTION_PLAN_ID"),
    effect: { kind: "subscription" }
  },
  ["credits10" /* Credits10 */]: {
    getPaymentProcessorPlanId: () => requireNodeEnvVar("PAYMENTS_CREDITS_10_PLAN_ID"),
    effect: { kind: "credits", amount: 10 }
  }
};

function ensureArgsSchemaOrThrowHttpError(schema, rawArgs) {
  const parseResult = schema.safeParse(rawArgs);
  if (!parseResult.success) {
    console.error(parseResult.error);
    throw new HttpError(400, "Operation arguments validation failed", { errors: parseResult.error.errors });
  } else {
    return parseResult.data;
  }
}

const updateUserAdminByIdInputSchema = z.object({
  id: z.string().nonempty(),
  isAdmin: z.boolean()
});
const updateIsUserAdminById$2 = async (rawArgs, context) => {
  const { id, isAdmin } = ensureArgsSchemaOrThrowHttpError(updateUserAdminByIdInputSchema, rawArgs);
  if (!context.user) {
    throw new HttpError(401, "Only authenticated users are allowed to perform this operation");
  }
  if (!context.user.isAdmin) {
    throw new HttpError(403, "Only admins are allowed to perform this operation");
  }
  return context.entities.User.update({
    where: { id },
    data: { isAdmin }
  });
};
const getPaginatorArgsSchema = z.object({
  skipPages: z.number(),
  filter: z.object({
    emailContains: z.string().nonempty().optional(),
    isAdmin: z.boolean().optional(),
    subscriptionStatusIn: z.array(z.nativeEnum(SubscriptionStatus).nullable()).optional()
  })
});
const getPaginatedUsers$2 = async (rawArgs, context) => {
  if (!context.user) {
    throw new HttpError(401, "Only authenticated users are allowed to perform this operation");
  }
  if (!context.user.isAdmin) {
    throw new HttpError(403, "Only admins are allowed to perform this operation");
  }
  const {
    skipPages,
    filter: { subscriptionStatusIn: subscriptionStatus, emailContains, isAdmin }
  } = ensureArgsSchemaOrThrowHttpError(getPaginatorArgsSchema, rawArgs);
  const includeUnsubscribedUsers = !!subscriptionStatus?.some((status) => status === null);
  const desiredSubscriptionStatuses = subscriptionStatus?.filter((status) => status !== null);
  const pageSize = 10;
  const userPageQuery = {
    skip: skipPages * pageSize,
    take: pageSize,
    where: {
      AND: [
        {
          email: {
            contains: emailContains,
            mode: "insensitive"
          },
          isAdmin
        },
        {
          OR: [
            {
              subscriptionStatus: {
                in: desiredSubscriptionStatuses
              }
            },
            {
              subscriptionStatus: includeUnsubscribedUsers ? null : void 0
            }
          ]
        }
      ]
    },
    select: {
      id: true,
      email: true,
      username: true,
      isAdmin: true,
      subscriptionStatus: true,
      paymentProcessorUserId: true
    },
    orderBy: {
      username: "asc"
    }
  };
  const [pageOfUsers, totalUsers] = await dbClient.$transaction([
    context.entities.User.findMany(userPageQuery),
    context.entities.User.count({ where: userPageQuery.where })
  ]);
  const totalPages = Math.ceil(totalUsers / pageSize);
  return {
    users: pageOfUsers,
    totalPages
  };
};

async function updateIsUserAdminById$1(args, context) {
  return updateIsUserAdminById$2(args, {
    ...context,
    entities: {
      User: dbClient.user
    }
  });
}

var updateIsUserAdminById = createAction(updateIsUserAdminById$1);

const openAi = setUpOpenAi();
function setUpOpenAi() {
  if (process.env.OPENAI_API_KEY) {
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  } else {
    throw new Error("OpenAI API key is not set");
  }
}
const generateGptResponseInputSchema = z.object({
  hours: z.number()
});
const generateGptResponse$2 = async (rawArgs, context) => {
  if (!context.user) {
    throw new HttpError(401, "Only authenticated users are allowed to perform this operation");
  }
  const { hours } = ensureArgsSchemaOrThrowHttpError(generateGptResponseInputSchema, rawArgs);
  const tasks = await context.entities.Task.findMany({
    where: {
      user: {
        id: context.user.id
      }
    }
  });
  console.log("Calling open AI api");
  const generatedSchedule = await generateScheduleWithGpt(tasks, hours);
  if (generatedSchedule === null) {
    throw new HttpError(500, "Encountered a problem in communication with OpenAI");
  }
  const createResponse = context.entities.GptResponse.create({
    data: {
      user: { connect: { id: context.user.id } },
      content: JSON.stringify(generatedSchedule)
    }
  });
  const transactions = [createResponse];
  if (!isUserSubscribed(context.user)) {
    if (context.user.credits > 0) {
      const decrementCredit = context.entities.User.update({
        where: { id: context.user.id },
        data: {
          credits: {
            decrement: 1
          }
        }
      });
      transactions.push(decrementCredit);
    } else {
      throw new HttpError(402, "User has not paid or is out of credits");
    }
  }
  console.log("Decrementing credits and saving response");
  await dbClient.$transaction(transactions);
  return generatedSchedule;
};
function isUserSubscribed(user) {
  return user.subscriptionStatus === SubscriptionStatus.Active || user.subscriptionStatus === SubscriptionStatus.CancelAtPeriodEnd;
}
const createTaskInputSchema = z.object({
  description: z.string().nonempty()
});
const createTask$2 = async (rawArgs, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  const { description } = ensureArgsSchemaOrThrowHttpError(createTaskInputSchema, rawArgs);
  const task = await context.entities.Task.create({
    data: {
      description,
      user: { connect: { id: context.user.id } }
    }
  });
  return task;
};
const updateTaskInputSchema = z.object({
  id: z.string().nonempty(),
  isDone: z.boolean().optional(),
  time: z.string().optional()
});
const updateTask$2 = async (rawArgs, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  const { id, isDone, time } = ensureArgsSchemaOrThrowHttpError(updateTaskInputSchema, rawArgs);
  const task = await context.entities.Task.update({
    where: {
      id,
      user: {
        id: context.user.id
      }
    },
    data: {
      isDone,
      time
    }
  });
  return task;
};
const deleteTaskInputSchema = z.object({
  id: z.string().nonempty()
});
const deleteTask$2 = async (rawArgs, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  const { id } = ensureArgsSchemaOrThrowHttpError(deleteTaskInputSchema, rawArgs);
  const task = await context.entities.Task.delete({
    where: {
      id,
      user: {
        id: context.user.id
      }
    }
  });
  return task;
};
const getGptResponses$2 = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  return context.entities.GptResponse.findMany({
    where: {
      user: {
        id: context.user.id
      }
    }
  });
};
const getAllTasksByUser$2 = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  return context.entities.Task.findMany({
    where: {
      user: {
        id: context.user.id
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
};
async function generateScheduleWithGpt(tasks, hours) {
  const parsedTasks = tasks.map(({ description, time }) => ({
    description,
    time
  }));
  const completion = await openAi.chat.completions.create({
    model: "gpt-3.5-turbo",
    // you can use any model here, e.g. 'gpt-3.5-turbo', 'gpt-4', etc.
    messages: [
      {
        role: "system",
        content: "you are an expert daily planner. you will be given a list of main tasks and an estimated time to complete each task. You will also receive the total amount of hours to be worked that day. Your job is to return a detailed plan of how to achieve those tasks by breaking each task down into at least 3 subtasks each. MAKE SURE TO ALWAYS CREATE AT LEAST 3 SUBTASKS FOR EACH MAIN TASK PROVIDED BY THE USER! YOU WILL BE REWARDED IF YOU DO."
      },
      {
        role: "user",
        content: `I will work ${hours} hours today. Here are the tasks I have to complete: ${JSON.stringify(
          parsedTasks
        )}. Please help me plan my day by breaking the tasks down into actionable subtasks with time and priority status.`
      }
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "parseTodaysSchedule",
          description: "parses the days tasks and returns a schedule",
          parameters: {
            type: "object",
            properties: {
              tasks: {
                type: "array",
                description: "Name of main tasks provided by user, ordered by priority",
                items: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                      description: "Name of main task provided by user"
                    },
                    priority: {
                      type: "string",
                      enum: ["low", "medium", "high"],
                      description: "task priority"
                    }
                  }
                }
              },
              taskItems: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    description: {
                      type: "string",
                      description: 'detailed breakdown and description of sub-task related to main task. e.g., "Prepare your learning session by first reading through the documentation"'
                    },
                    time: {
                      type: "number",
                      description: "time allocated for a given subtask in hours, e.g. 0.5"
                    },
                    taskName: {
                      type: "string",
                      description: "name of main task related to subtask"
                    }
                  }
                }
              }
            },
            required: ["tasks", "taskItems", "time", "priority"]
          }
        }
      }
    ],
    tool_choice: {
      type: "function",
      function: {
        name: "parseTodaysSchedule"
      }
    },
    temperature: 1
  });
  const gptResponse = completion?.choices[0]?.message?.tool_calls?.[0]?.function.arguments;
  return gptResponse !== void 0 ? JSON.parse(gptResponse) : null;
}

async function generateGptResponse$1(args, context) {
  return generateGptResponse$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      Task: dbClient.task,
      GptResponse: dbClient.gptResponse
    }
  });
}

var generateGptResponse = createAction(generateGptResponse$1);

async function createTask$1(args, context) {
  return createTask$2(args, {
    ...context,
    entities: {
      Task: dbClient.task
    }
  });
}

var createTask = createAction(createTask$1);

async function deleteTask$1(args, context) {
  return deleteTask$2(args, {
    ...context,
    entities: {
      Task: dbClient.task
    }
  });
}

var deleteTask = createAction(deleteTask$1);

async function updateTask$1(args, context) {
  return updateTask$2(args, {
    ...context,
    entities: {
      Task: dbClient.task
    }
  });
}

var updateTask = createAction(updateTask$1);

const stripe = new Stripe(requireNodeEnvVar("STRIPE_API_KEY"), {
  // NOTE:
  // API version below should ideally match the API version in your Stripe dashboard.
  // If that is not the case, you will most likely want to (up/down)grade the `stripe`
  // npm package to the API version that matches your Stripe dashboard's one.
  // For more details and alternative setups check
  // https://docs.stripe.com/api/versioning .
  apiVersion: "2025-04-30.basil"
});

const DOMAIN = process.env.WASP_WEB_CLIENT_URL || "http://localhost:3000";
async function fetchStripeCustomer(customerEmail) {
  let customer;
  try {
    const stripeCustomers = await stripe.customers.list({
      email: customerEmail
    });
    if (!stripeCustomers.data.length) {
      console.log("creating customer");
      customer = await stripe.customers.create({
        email: customerEmail
      });
    } else {
      console.log("using existing customer");
      customer = stripeCustomers.data[0];
    }
    return customer;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
async function createStripeCheckoutSession({
  priceId,
  customerId,
  mode
}) {
  try {
    return await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode,
      success_url: `${DOMAIN}/checkout?status=success`,
      cancel_url: `${DOMAIN}/checkout?status=canceled`,
      automatic_tax: { enabled: true },
      allow_promotion_codes: true,
      customer_update: {
        address: "auto"
      },
      customer: customerId
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
}

const updateUserStripePaymentDetails = async ({ userStripeId, subscriptionPlan, subscriptionStatus, datePaid, numOfCreditsPurchased }, userDelegate) => {
  return userDelegate.update({
    where: {
      paymentProcessorUserId: userStripeId
    },
    data: {
      paymentProcessorUserId: userStripeId,
      subscriptionPlan,
      subscriptionStatus,
      datePaid,
      credits: numOfCreditsPurchased !== void 0 ? { increment: numOfCreditsPurchased } : void 0
    }
  });
};

function getDefaultFromField() {
  return {
    email: "nathan@postmarkr.com",
    name: "Postmarkr"
  };
}

const yellowColorFormatString = getColorizedConsoleFormatString("yellow");
function initDummyEmailSender(config) {
  const defaultFromField = getDefaultFromField();
  return {
    send: async (email) => {
      const fromField = email.from || defaultFromField;
      console.log(yellowColorFormatString, "\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557");
      console.log(yellowColorFormatString, "\u2551 Dummy email sender \u2709\uFE0F  \u2551");
      console.log(yellowColorFormatString, "\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D");
      console.log(`From:    ${fromField.name} <${fromField.email}>`);
      console.log(`To:      ${email.to}`);
      console.log(`Subject: ${email.subject}`);
      console.log(yellowColorFormatString, "\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 Text \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550");
      console.log(email.text);
      console.log(yellowColorFormatString, "\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 HTML \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550");
      console.log(email.html);
      console.log(yellowColorFormatString, "\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550");
      return {
        success: true
      };
    }
  };
}

const emailSender = initDummyEmailSender();

function assertUnreachable(x) {
  throw Error("This code should be unreachable");
}

class UnhandledWebhookEventError extends Error {
  constructor(eventType) {
    super(`Unhandled event type: ${eventType}`);
    this.name = "UnhandledWebhookEventError";
  }
}

async function parseWebhookPayload(rawStripeEvent) {
  try {
    const event = await genericStripeEventSchema.parseAsync(rawStripeEvent);
    switch (event.type) {
      case "checkout.session.completed":
        const session = await sessionCompletedDataSchema.parseAsync(event.data.object);
        return { eventName: event.type, data: session };
      case "invoice.paid":
        const invoice = await invoicePaidDataSchema.parseAsync(event.data.object);
        return { eventName: event.type, data: invoice };
      case "customer.subscription.updated":
        const updatedSubscription = await subscriptionUpdatedDataSchema.parseAsync(event.data.object);
        return { eventName: event.type, data: updatedSubscription };
      case "customer.subscription.deleted":
        const deletedSubscription = await subscriptionDeletedDataSchema.parseAsync(event.data.object);
        return { eventName: event.type, data: deletedSubscription };
      case "payment_intent.succeeded":
        const paymentIntent = await paymentIntentSucceededDataSchema.parseAsync(event.data.object);
        return { eventName: event.type, data: paymentIntent };
      case "payment_intent.payment_failed":
        const failedPaymentIntent = await paymentIntentFailedDataSchema.parseAsync(event.data.object);
        return { eventName: event.type, data: failedPaymentIntent };
      default:
        throw new UnhandledWebhookEventError(event.type);
    }
  } catch (e) {
    if (e instanceof UnhandledWebhookEventError) {
      throw e;
    } else {
      console.error(e);
      throw new HttpError(400, "Error parsing Stripe event object");
    }
  }
}
const genericStripeEventSchema = z.object({
  type: z.string(),
  data: z.object({
    object: z.unknown()
  })
});
const sessionCompletedDataSchema = z.object({
  id: z.string(),
  customer: z.string(),
  payment_status: z.enum(["paid", "unpaid", "no_payment_required"]),
  mode: z.enum(["payment", "subscription"]),
  metadata: z.record(z.string()).optional()
});
const invoicePaidDataSchema = z.object({
  id: z.string(),
  customer: z.string(),
  period_start: z.number(),
  lines: z.object({
    data: z.array(
      z.object({
        pricing: z.object({ price_details: z.object({ price: z.string() }) })
      })
    )
  })
});
const subscriptionUpdatedDataSchema = z.object({
  customer: z.string(),
  status: z.string(),
  cancel_at_period_end: z.boolean(),
  items: z.object({
    data: z.array(
      z.object({
        price: z.object({
          id: z.string()
        })
      })
    )
  })
});
const subscriptionDeletedDataSchema = z.object({
  customer: z.string()
});
const paymentIntentSucceededDataSchema = z.object({
  id: z.string(),
  customer: z.string().optional(),
  metadata: z.record(z.string()).optional(),
  amount: z.number(),
  currency: z.string()
});
const paymentIntentFailedDataSchema = z.object({
  id: z.string(),
  customer: z.string().optional(),
  metadata: z.record(z.string()).optional(),
  amount: z.number(),
  currency: z.string(),
  last_payment_error: z.object({
    message: z.string()
  }).optional()
});

const stripeWebhook = async (request, response, context) => {
  try {
    const rawStripeEvent = constructStripeEvent(request);
    const { eventName, data } = await parseWebhookPayload(rawStripeEvent);
    const prismaUserDelegate = context.entities.User;
    switch (eventName) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(data, prismaUserDelegate);
        break;
      case "invoice.paid":
        await handleInvoicePaid(data, prismaUserDelegate);
        break;
      case "customer.subscription.updated":
        await handleCustomerSubscriptionUpdated(data, prismaUserDelegate);
        break;
      case "customer.subscription.deleted":
        await handleCustomerSubscriptionDeleted(data, prismaUserDelegate);
        break;
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(data, context);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(data, context);
        break;
      default:
        assertUnreachable(eventName);
    }
    return response.json({ received: true });
  } catch (err) {
    if (err instanceof UnhandledWebhookEventError) {
      console.error(err.message);
      return response.status(422).json({ error: err.message });
    }
    console.error("Webhook error:", err);
    if (err instanceof HttpError) {
      return response.status(err.statusCode).json({ error: err.message });
    } else {
      return response.status(400).json({ error: "Error processing Stripe webhook event" });
    }
  }
};
function constructStripeEvent(request) {
  try {
    const secret = requireNodeEnvVar("STRIPE_WEBHOOK_SECRET");
    const sig = request.headers["stripe-signature"];
    if (!sig) {
      throw new HttpError(400, "Stripe webhook signature not provided");
    }
    return stripe.webhooks.constructEvent(request.body, sig, secret);
  } catch (err) {
    throw new HttpError(500, "Error constructing Stripe webhook event");
  }
}
const stripeMiddlewareConfigFn = (middlewareConfig) => {
  middlewareConfig.delete("express.json");
  middlewareConfig.set("express.raw", express.raw({ type: "application/json" }));
  return middlewareConfig;
};
async function handleCheckoutSessionCompleted(session, prismaUserDelegate) {
  const isSuccessfulOneTimePayment = session.mode === "payment" && session.payment_status === "paid";
  if (isSuccessfulOneTimePayment) {
    if (session.metadata?.type === "mail_payment" && session.metadata?.mailPieceId) {
      await handleMailPaymentCompleted(session);
    } else {
      await saveSuccessfulOneTimePayment(session, prismaUserDelegate);
    }
  }
}
async function handleMailPaymentCompleted(session) {
  try {
    const mailPieceId = session.metadata?.mailPieceId;
    if (!mailPieceId) {
      console.error("Mail payment completed but no mailPieceId in metadata");
      return;
    }
    const { confirmMailPaymentService } = require("../../server/mail/payments");
    await confirmMailPaymentService(
      session.id,
      // Use session ID as payment intent ID
      mailPieceId,
      { entities: { MailPiece: require("wasp/server").prisma.mailPiece, MailPieceStatusHistory: require("wasp/server").prisma.mailPieceStatusHistory } }
    );
    console.log(`Mail payment completed for mail piece ${mailPieceId}`);
  } catch (error) {
    console.error("Failed to handle mail payment completion:", error);
  }
}
async function saveSuccessfulOneTimePayment(session, prismaUserDelegate) {
  const userStripeId = session.customer;
  const lineItems = await getCheckoutLineItemsBySessionId(session.id);
  const lineItemPriceId = extractPriceId(lineItems);
  const planId = getPlanIdByPriceId(lineItemPriceId);
  const plan = paymentPlans[planId];
  const { numOfCreditsPurchased } = getPlanEffectPaymentDetails({ planId, planEffect: plan.effect });
  return updateUserStripePaymentDetails(
    { userStripeId, numOfCreditsPurchased, datePaid: /* @__PURE__ */ new Date() },
    prismaUserDelegate
  );
}
async function handleInvoicePaid(invoice, prismaUserDelegate) {
  await saveActiveSubscription(invoice, prismaUserDelegate);
}
async function saveActiveSubscription(invoice, prismaUserDelegate) {
  const userStripeId = invoice.customer;
  const datePaid = new Date(invoice.period_start * 1e3);
  const priceId = extractPriceId(invoice.lines);
  const subscriptionPlan = getPlanIdByPriceId(priceId);
  return updateUserStripePaymentDetails(
    { userStripeId, datePaid, subscriptionPlan, subscriptionStatus: SubscriptionStatus.Active },
    prismaUserDelegate
  );
}
async function handleCustomerSubscriptionUpdated(subscription, prismaUserDelegate) {
  const userStripeId = subscription.customer;
  let subscriptionStatus;
  const priceId = extractPriceId(subscription.items);
  const subscriptionPlan = getPlanIdByPriceId(priceId);
  if (subscription.status === SubscriptionStatus.Active) {
    subscriptionStatus = subscription.cancel_at_period_end ? SubscriptionStatus.CancelAtPeriodEnd : SubscriptionStatus.Active;
  } else if (subscription.status === SubscriptionStatus.PastDue) {
    subscriptionStatus = SubscriptionStatus.PastDue;
  }
  if (subscriptionStatus) {
    const user = await updateUserStripePaymentDetails(
      { userStripeId, subscriptionPlan, subscriptionStatus },
      prismaUserDelegate
    );
    if (subscription.cancel_at_period_end) {
      if (user.email) {
        await emailSender.send({
          to: user.email,
          subject: "We hate to see you go :(",
          text: "We hate to see you go. Here is a sweet offer...",
          html: "We hate to see you go. Here is a sweet offer..."
        });
      }
    }
    return user;
  }
}
async function handleCustomerSubscriptionDeleted(subscription, prismaUserDelegate) {
  const userStripeId = subscription.customer;
  return updateUserStripePaymentDetails(
    { userStripeId, subscriptionStatus: SubscriptionStatus.Deleted },
    prismaUserDelegate
  );
}
function extractPriceId(items) {
  if (items.data.length === 0) {
    throw new HttpError(400, "No items in stripe event object");
  }
  if (items.data.length > 1) {
    throw new HttpError(400, "More than one item in stripe event object");
  }
  const item = items.data[0];
  if ("price" in item && item.price?.id) {
    return item.price.id;
  }
  if ("pricing" in item) {
    const priceId = item.pricing?.price_details?.price;
    if (priceId) {
      return priceId;
    }
  }
  throw new HttpError(400, "Unable to extract price id from item");
}
async function getCheckoutLineItemsBySessionId(sessionId) {
  const { line_items } = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items"]
  });
  if (!line_items) {
    throw new HttpError(400, "No line items found in checkout session");
  }
  return line_items;
}
function getPlanIdByPriceId(priceId) {
  const planId = Object.values(PaymentPlanId).find(
    (planId2) => paymentPlans[planId2].getPaymentProcessorPlanId() === priceId
  );
  if (!planId) {
    throw new Error(`No plan with Stripe price id ${priceId}`);
  }
  return planId;
}
function getPlanEffectPaymentDetails({
  planId,
  planEffect
}) {
  switch (planEffect.kind) {
    case "subscription":
      return { subscriptionPlan: planId, numOfCreditsPurchased: void 0 };
    case "credits":
      return { subscriptionPlan: void 0, numOfCreditsPurchased: planEffect.amount };
    default:
      assertUnreachable();
  }
}
async function handlePaymentIntentSucceeded(paymentIntent, context) {
  if (paymentIntent.metadata?.type === "mail_payment") {
    const mailPieceId = paymentIntent.metadata.mailPieceId;
    if (mailPieceId) {
      await context.entities.MailPiece.update({
        where: { paymentIntentId: paymentIntent.id },
        data: {
          paymentStatus: "paid",
          status: "paid"
        }
      });
      await context.entities.MailPieceStatusHistory.create({
        data: {
          mailPieceId,
          status: "paid",
          previousStatus: "pending_payment",
          description: "Payment confirmed via webhook",
          source: "webhook"
        }
      });
      console.log(`Mail payment succeeded for payment intent ${paymentIntent.id}`);
    }
  }
}
async function handlePaymentIntentFailed(paymentIntent, context) {
  if (paymentIntent.metadata?.type === "mail_payment") {
    const mailPieceId = paymentIntent.metadata.mailPieceId;
    if (mailPieceId) {
      await context.entities.MailPiece.update({
        where: { paymentIntentId: paymentIntent.id },
        data: {
          paymentStatus: "failed",
          status: "failed"
        }
      });
      await context.entities.MailPieceStatusHistory.create({
        data: {
          mailPieceId,
          status: "failed",
          previousStatus: "pending_payment",
          description: `Payment failed: ${paymentIntent.last_payment_error?.message || "Unknown error"}`,
          source: "webhook"
        }
      });
      console.log(`Mail payment failed for payment intent ${paymentIntent.id}`);
    }
  }
}

const stripePaymentProcessor = {
  id: "stripe",
  createCheckoutSession: async ({ userId, userEmail, paymentPlan, prismaUserDelegate }) => {
    const customer = await fetchStripeCustomer(userEmail);
    const stripeSession = await createStripeCheckoutSession({
      priceId: paymentPlan.getPaymentProcessorPlanId(),
      customerId: customer.id,
      mode: paymentPlanEffectToStripeMode(paymentPlan.effect)
    });
    await prismaUserDelegate.update({
      where: {
        id: userId
      },
      data: {
        paymentProcessorUserId: customer.id
      }
    });
    if (!stripeSession.url) throw new Error("Error creating Stripe Checkout Session");
    const session = {
      url: stripeSession.url,
      id: stripeSession.id
    };
    return { session };
  },
  fetchCustomerPortalUrl: async (_args) => requireNodeEnvVar("STRIPE_CUSTOMER_PORTAL_URL"),
  webhook: stripeWebhook,
  webhookMiddlewareConfigFn: stripeMiddlewareConfigFn
};
function paymentPlanEffectToStripeMode(planEffect) {
  const effectToMode = {
    subscription: "subscription",
    credits: "payment"
  };
  return effectToMode[planEffect.kind];
}

const paymentProcessor = stripePaymentProcessor;

const generateCheckoutSessionSchema = z.nativeEnum(PaymentPlanId);
const generateCheckoutSession$2 = async (rawPaymentPlanId, context) => {
  if (!context.user) {
    throw new HttpError(401, "Only authenticated users are allowed to perform this operation");
  }
  const paymentPlanId = ensureArgsSchemaOrThrowHttpError(generateCheckoutSessionSchema, rawPaymentPlanId);
  const userId = context.user.id;
  const userEmail = context.user.email;
  if (!userEmail) {
    throw new HttpError(403, "User needs an email to make a payment.");
  }
  const paymentPlan = paymentPlans[paymentPlanId];
  const { session } = await paymentProcessor.createCheckoutSession({
    userId,
    userEmail,
    paymentPlan,
    prismaUserDelegate: context.entities.User
  });
  return {
    sessionUrl: session.url,
    sessionId: session.id
  };
};
const getCustomerPortalUrl$2 = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401, "Only authenticated users are allowed to perform this operation");
  }
  return paymentProcessor.fetchCustomerPortalUrl({
    userId: context.user.id,
    prismaUserDelegate: context.entities.User
  });
};

async function generateCheckoutSession$1(args, context) {
  return generateCheckoutSession$2(args, {
    ...context,
    entities: {
      User: dbClient.user
    }
  });
}

var generateCheckoutSession = createAction(generateCheckoutSession$1);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = [
  "application/pdf"
];

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_S3_IAM_ACCESS_KEY,
    secretAccessKey: process.env.AWS_S3_IAM_SECRET_KEY
  }
});
const getUploadFileSignedURLFromS3 = async ({ fileName, fileType, userId }) => {
  const key = getS3Key(fileName, userId);
  const { url: s3UploadUrl, fields: s3UploadFields } = await createPresignedPost(s3Client, {
    Bucket: process.env.AWS_S3_FILES_BUCKET,
    Key: key,
    Conditions: [["content-length-range", 0, MAX_FILE_SIZE_BYTES]],
    Fields: {
      "Content-Type": fileType
    },
    Expires: 3600
  });
  return { s3UploadUrl, key, s3UploadFields };
};
const getDownloadFileSignedURLFromS3 = async ({ key }) => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_FILES_BUCKET,
    Key: key
  });
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
};
const deleteFileFromS3 = async ({ key }) => {
  const command = new DeleteObjectCommand({
    Bucket: process.env.AWS_S3_FILES_BUCKET,
    Key: key
  });
  return await s3Client.send(command);
};
function getS3Key(fileName, userId) {
  const ext = path.extname(fileName).slice(1);
  return `${userId}/${randomUUID()}.${ext}`;
}

const extractPDFMetadataFromBuffer = async (buffer) => {
  try {
    const pdfDoc = await PDFDocument.load(buffer);
    const pageCount = pdfDoc.getPageCount();
    const firstPage = pdfDoc.getPage(0);
    const { width, height } = firstPage.getSize();
    const title = pdfDoc.getTitle();
    const author = pdfDoc.getAuthor();
    const subject = pdfDoc.getSubject();
    const creator = pdfDoc.getCreator();
    const producer = pdfDoc.getProducer();
    const creationDate = pdfDoc.getCreationDate();
    const modificationDate = pdfDoc.getModificationDate();
    return {
      pageCount,
      dimensions: {
        width,
        height
      },
      metadata: {
        title: title || void 0,
        author: author || void 0,
        subject: subject || void 0,
        creator: creator || void 0,
        producer: producer || void 0,
        creationDate: creationDate || void 0,
        modificationDate: modificationDate || void 0
      }
    };
  } catch (error) {
    throw new Error(`Failed to extract PDF metadata: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};
const isPDFBuffer = (buffer) => {
  const pdfHeader = buffer.subarray(0, 4);
  return pdfHeader.toString() === "%PDF";
};

const boss = createPgBoss();
function createPgBoss() {
  let pgBossNewOptions = {
    connectionString: config$1.databaseUrl
  };
  if (env.PG_BOSS_NEW_OPTIONS) {
    try {
      pgBossNewOptions = JSON.parse(env.PG_BOSS_NEW_OPTIONS);
    } catch {
      console.error("Environment variable PG_BOSS_NEW_OPTIONS was not parsable by JSON.parse()!");
    }
  }
  return new PgBoss(pgBossNewOptions);
}
let resolvePgBossStarted;
let rejectPgBossStarted;
const pgBossStarted = new Promise((resolve, reject) => {
  resolvePgBossStarted = resolve;
  rejectPgBossStarted = reject;
});
var PgBossStatus;
(function(PgBossStatus2) {
  PgBossStatus2["Unstarted"] = "Unstarted";
  PgBossStatus2["Starting"] = "Starting";
  PgBossStatus2["Started"] = "Started";
  PgBossStatus2["Error"] = "Error";
})(PgBossStatus || (PgBossStatus = {}));
let pgBossStatus = PgBossStatus.Unstarted;
async function startPgBoss() {
  if (pgBossStatus !== PgBossStatus.Unstarted) {
    return;
  }
  pgBossStatus = PgBossStatus.Starting;
  console.log("Starting pg-boss...");
  boss.on("error", (error) => console.error(error));
  try {
    await boss.start();
  } catch (error) {
    console.error("pg-boss failed to start!");
    console.error(error);
    pgBossStatus = PgBossStatus.Error;
    rejectPgBossStarted(boss);
    return;
  }
  resolvePgBossStarted(boss);
  console.log("pg-boss started!");
  pgBossStatus = PgBossStatus.Started;
}

class Job {
  jobName;
  executorName;
  constructor(jobName, executorName) {
    this.jobName = jobName;
    this.executorName = executorName;
  }
}
class SubmittedJob {
  job;
  jobId;
  constructor(job, jobId) {
    this.job = job;
    this.jobId = jobId;
  }
}

const PG_BOSS_EXECUTOR_NAME = Symbol("PgBoss");
function createJobDefinition({ jobName, defaultJobOptions, jobSchedule, entities }) {
  return new PgBossJob(jobName, defaultJobOptions, entities, jobSchedule);
}
function registerJob({ job, jobFn }) {
  pgBossStarted.then(async (boss) => {
    await boss.offWork(job.jobName);
    await boss.work(job.jobName, pgBossCallbackWrapper(jobFn, job.entities));
    if (job.jobSchedule) {
      const options = {
        ...job.defaultJobOptions,
        ...job.jobSchedule.options
      };
      await boss.schedule(job.jobName, job.jobSchedule.cron, job.jobSchedule.args, options);
    }
  });
}
class PgBossJob extends Job {
  defaultJobOptions;
  startAfter;
  entities;
  jobSchedule;
  constructor(jobName, defaultJobOptions, entities, jobSchedule, startAfter) {
    super(jobName, PG_BOSS_EXECUTOR_NAME);
    this.defaultJobOptions = defaultJobOptions;
    this.entities = entities;
    this.jobSchedule = jobSchedule;
    this.startAfter = startAfter;
  }
  delay(startAfter) {
    return new PgBossJob(this.jobName, this.defaultJobOptions, this.entities, this.jobSchedule, startAfter);
  }
  async submit(jobArgs, jobOptions = {}) {
    const boss = await pgBossStarted;
    const jobId = await boss.send(this.jobName, jobArgs, {
      ...this.defaultJobOptions,
      ...this.startAfter && { startAfter: this.startAfter },
      ...jobOptions
    });
    return new PgBossSubmittedJob(boss, this, jobId);
  }
}
class PgBossSubmittedJob extends SubmittedJob {
  pgBoss;
  constructor(boss, job, jobId) {
    super(job, jobId);
    this.pgBoss = {
      cancel: () => boss.cancel(jobId),
      resume: () => boss.resume(jobId),
      // Coarcing here since pg-boss typings are not precise enough.
      details: () => boss.getJobById(jobId)
    };
  }
}
function pgBossCallbackWrapper(jobFn, entities) {
  return (args) => {
    const context = { entities };
    return jobFn(args.data, context);
  };
}

const entities$1 = {
  File: dbClient.file
};
const jobSchedule$1 = null;
const processPDFMetadata$1 = createJobDefinition({
  jobName: "processPDFMetadata",
  defaultJobOptions: {},
  jobSchedule: jobSchedule$1,
  entities: entities$1
});

const entities = {
  User: dbClient.user,
  DailyStats: dbClient.dailyStats,
  Logs: dbClient.logs,
  PageViewSource: dbClient.pageViewSource
};
const jobSchedule = {
  cron: "0 * * * *",
  options: {}
};
const dailyStatsJob = createJobDefinition({
  jobName: "dailyStatsJob",
  defaultJobOptions: {},
  jobSchedule,
  entities
});

const createFileInputSchema = z.object({
  fileType: z.enum(ALLOWED_FILE_TYPES),
  fileName: z.string().nonempty()
});
const createFile$2 = async (rawArgs, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  const { fileType, fileName } = ensureArgsSchemaOrThrowHttpError(createFileInputSchema, rawArgs);
  const { s3UploadUrl, s3UploadFields, key } = await getUploadFileSignedURLFromS3({
    fileType,
    fileName,
    userId: context.user.id
  });
  const file = await context.entities.File.create({
    data: {
      name: fileName,
      key,
      uploadUrl: s3UploadUrl,
      type: fileType,
      user: { connect: { id: context.user.id } }
    }
  });
  if (fileType === "application/pdf") {
    await processPDFMetadata$1.submit({ fileId: file.id });
  }
  return {
    s3UploadUrl,
    s3UploadFields
  };
};
const getAllFilesByUser$2 = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  return context.entities.File.findMany({
    where: {
      user: {
        id: context.user.id
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
};
const getDownloadFileSignedURLInputSchema = z.object({ key: z.string().nonempty() });
const getDownloadFileSignedURL$2 = async (rawArgs, _context) => {
  const { key } = ensureArgsSchemaOrThrowHttpError(getDownloadFileSignedURLInputSchema, rawArgs);
  return await getDownloadFileSignedURLFromS3({ key });
};
const deleteFileInputSchema = z.object({
  fileId: z.string().nonempty()
});
const deleteFile$2 = async (rawArgs, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  const { fileId } = ensureArgsSchemaOrThrowHttpError(deleteFileInputSchema, rawArgs);
  const file = await context.entities.File.delete({
    where: {
      id: fileId,
      user: {
        id: context.user.id
      }
    }
  });
  try {
    await deleteFileFromS3({ key: file.key });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to delete file from S3:", error);
    }
  }
  return file;
};
const processPDFMetadata = async (args, context) => {
  const { fileId } = args;
  try {
    const file = await context.entities.File.findFirst({
      where: {
        id: fileId,
        type: "application/pdf"
      }
    });
    if (!file) {
      return;
    }
    if (file.validationStatus === "valid" && file.pdfMetadata) {
      return;
    }
    if (file.validationStatus === "processing") {
      return;
    }
    await context.entities.File.update({
      where: { id: fileId },
      data: { validationStatus: "processing" }
    });
    const s3Client = new S3Client({
      region: process.env.AWS_S3_REGION,
      credentials: {
        accessKeyId: process.env.AWS_S3_IAM_ACCESS_KEY,
        secretAccessKey: process.env.AWS_S3_IAM_SECRET_KEY
      }
    });
    const getObjectCommand = new GetObjectCommand({
      Bucket: process.env.AWS_S3_FILES_BUCKET,
      Key: file.key
    });
    const response = await s3Client.send(getObjectCommand);
    const pdfBuffer = Buffer.from(await response.Body.transformToByteArray());
    if (!isPDFBuffer(pdfBuffer)) {
      throw new Error("Invalid PDF file format");
    }
    const metadata = await extractPDFMetadataFromBuffer(pdfBuffer);
    await context.entities.File.update({
      where: { id: fileId },
      data: {
        pageCount: metadata.pageCount,
        pdfMetadata: metadata,
        validationStatus: "valid",
        lastProcessedAt: /* @__PURE__ */ new Date()
      }
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(`Error processing PDF metadata for file ${fileId}:`, error);
    }
    await context.entities.File.update({
      where: { id: fileId },
      data: {
        validationStatus: "invalid",
        validationError: error instanceof Error ? error.message : "Unknown processing error"
      }
    });
  }
};

async function createFile$1(args, context) {
  return createFile$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      File: dbClient.file
    }
  });
}

var createFile = createAction(createFile$1);

async function deleteFile$1(args, context) {
  return deleteFile$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      File: dbClient.file
    }
  });
}

var deleteFile = createAction(deleteFile$1);

const createMailAddressInputSchema = z.object({
  contactName: z.string().nonempty(),
  companyName: z.string().optional(),
  addressLine1: z.string().nonempty(),
  addressLine2: z.string().optional(),
  city: z.string().nonempty(),
  state: z.string().nonempty(),
  postalCode: z.string().nonempty(),
  country: z.string().nonempty(),
  label: z.string().optional(),
  addressType: z.enum(["sender", "recipient", "both"]).default("both")
});
const createMailAddress$2 = async (rawArgs, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  const data = ensureArgsSchemaOrThrowHttpError(createMailAddressInputSchema, rawArgs);
  const address = await context.entities.MailAddress.create({
    data: {
      ...data,
      user: { connect: { id: context.user.id } }
    }
  });
  return address;
};
const getMailAddressesByUser$2 = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  return context.entities.MailAddress.findMany({
    where: {
      user: {
        id: context.user.id
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
};
const deleteMailAddress$2 = async (rawArgs, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  const { id } = ensureArgsSchemaOrThrowHttpError(z.object({ id: z.string().nonempty() }), rawArgs);
  return context.entities.MailAddress.delete({
    where: {
      id,
      user: {
        id: context.user.id
      }
    }
  });
};
const updateMailAddressInputSchema = z.object({
  id: z.string().nonempty(),
  data: z.object({
    contactName: z.string().optional(),
    companyName: z.string().optional(),
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
    label: z.string().optional(),
    addressType: z.enum(["sender", "recipient", "both"]).optional()
  })
});
const updateMailAddress$2 = async (rawArgs, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  const { id, data } = ensureArgsSchemaOrThrowHttpError(updateMailAddressInputSchema, rawArgs);
  return context.entities.MailAddress.update({
    where: {
      id,
      user: {
        id: context.user.id
      }
    },
    data
  });
};
const setDefaultAddress$2 = async (rawArgs, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  const { id } = ensureArgsSchemaOrThrowHttpError(z.object({ id: z.string().nonempty() }), rawArgs);
  await context.entities.MailAddress.updateMany({
    where: {
      userId: context.user.id,
      isDefault: true
    },
    data: {
      isDefault: false
    }
  });
  return context.entities.MailAddress.update({
    where: {
      id,
      user: {
        id: context.user.id
      }
    },
    data: {
      isDefault: true
    }
  });
};

async function createMailAddress$1(args, context) {
  return createMailAddress$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      MailAddress: dbClient.mailAddress
    }
  });
}

var createMailAddress = createAction(createMailAddress$1);

async function updateMailAddress$1(args, context) {
  return updateMailAddress$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      MailAddress: dbClient.mailAddress
    }
  });
}

var updateMailAddress = createAction(updateMailAddress$1);

async function deleteMailAddress$1(args, context) {
  return deleteMailAddress$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      MailAddress: dbClient.mailAddress
    }
  });
}

var deleteMailAddress = createAction(deleteMailAddress$1);

async function setDefaultAddress$1(args, context) {
  return setDefaultAddress$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      MailAddress: dbClient.mailAddress
    }
  });
}

var setDefaultAddress = createAction(setDefaultAddress$1);

const mailTypeSchema = z$1.enum([
  "postcard",
  "letter",
  "check",
  "self_mailer",
  "catalog",
  "booklet"
]);
const mailClassSchema = z$1.enum([
  "usps_first_class",
  "usps_standard",
  "usps_express",
  "usps_priority"
]);
const mailSizeSchema = z$1.enum([
  "4x6",
  "6x9",
  "6x11",
  "6x18",
  "9x12",
  "12x15",
  "12x18"
]);
const mailPieceStatusSchema = z$1.enum([
  "draft",
  "pending_payment",
  "paid",
  "submitted",
  "in_transit",
  "delivered",
  "returned",
  "failed"
]);
z$1.enum([
  "pending",
  "paid",
  "failed",
  "refunded"
]);
const statusSourceSchema = z$1.enum([
  "system",
  "user",
  "lob",
  "webhook",
  "manual"
]);
const createMailPieceSchema = z$1.object({
  mailType: mailTypeSchema,
  mailClass: mailClassSchema,
  mailSize: mailSizeSchema,
  senderAddressId: z$1.string().uuid("Invalid sender address ID"),
  recipientAddressId: z$1.string().uuid("Invalid recipient address ID"),
  fileId: z$1.string().uuid("Invalid file ID").optional(),
  description: z$1.string().min(1, "Description is required").max(500, "Description too long").optional()
}).refine(
  (data) => data.senderAddressId !== data.recipientAddressId,
  {
    message: "Sender and recipient addresses must be different",
    path: ["recipientAddressId"]
  }
);
const updateMailPieceSchema = z$1.object({
  id: z$1.string().uuid("Invalid mail piece ID"),
  mailType: mailTypeSchema.optional(),
  mailClass: mailClassSchema.optional(),
  mailSize: mailSizeSchema.optional(),
  senderAddressId: z$1.string().uuid("Invalid sender address ID").optional(),
  recipientAddressId: z$1.string().uuid("Invalid recipient address ID").optional(),
  fileId: z$1.string().uuid("Invalid file ID").optional(),
  description: z$1.string().min(1, "Description is required").max(500, "Description too long").optional()
}).refine(
  (data) => {
    if (data.senderAddressId && data.recipientAddressId) {
      return data.senderAddressId !== data.recipientAddressId;
    }
    return true;
  },
  {
    message: "Sender and recipient addresses must be different",
    path: ["recipientAddressId"]
  }
);
z$1.object({
  id: z$1.string().uuid("Invalid mail piece ID"),
  status: mailPieceStatusSchema,
  description: z$1.string().max(500, "Description too long").optional(),
  source: statusSourceSchema.default("manual")
});
const lobWebhookStatusSchema = z$1.object({
  lobId: z$1.string().min(1, "Lob ID is required"),
  lobStatus: z$1.string().optional(),
  lobTrackingNumber: z$1.string().optional(),
  lobData: z$1.any().optional()
});
const validationErrors = {
  UNAUTHORIZED: "Not authorized to perform this action",
  MAIL_PIECE_NOT_FOUND: "Mail piece not found",
  ADDRESS_NOT_FOUND: "Address not found or not owned by user",
  FILE_NOT_FOUND: "File not found or not owned by user",
  INVALID_STATUS_TRANSITION: "Invalid status transition",
  INVALID_INPUT: "Invalid input data",
  MISSING_REQUIRED_FIELD: "Required field is missing"
};

function getLobApiKey() {
  const environment = process.env.LOB_ENVIRONMENT || "test";
  if (environment === "live" || environment === "prod") {
    return process.env.LOB_PROD_KEY || null;
  } else {
    return process.env.LOB_TEST_KEY || null;
  }
}
const lobApiKey = getLobApiKey();
const lob = lobApiKey ? new Lob(lobApiKey) : null;

async function validateAddress(addressData) {
  try {
    const lobApiKey = process.env.LOB_TEST_KEY || process.env.LOB_PROD_KEY;
    if (!lobApiKey) {
      console.warn("Lob API key not configured, using simulation mode");
      return {
        isValid: Math.random() > 0.2,
        // 80% success rate for demo
        verifiedAddress: {
          id: `sim_${Date.now()}`,
          ...addressData
        },
        error: null
      };
    }
    if (!lob) {
      throw new Error("Lob client not initialized - API key missing");
    }
    const verification = await lob.usVerifications.verify({
      address_line1: addressData.address_line1,
      address_line2: addressData.address_line2,
      city: addressData.city,
      state: addressData.state,
      zip_code: addressData.zip_code,
      country: addressData.country
    });
    return {
      isValid: verification.deliverability === "deliverable",
      verifiedAddress: verification.address,
      error: verification.deliverability === "undeliverable" ? "Address is not deliverable" : null
    };
  } catch (error) {
    console.error("Lob address validation error:", error);
    throw new HttpError(500, "Failed to validate address");
  }
}
async function calculateCost(mailSpecs) {
  try {
    const lobApiKey = process.env.LOB_TEST_KEY || process.env.LOB_PROD_KEY;
    if (!lobApiKey || !lob) {
      console.warn("Lob API key not configured, using fallback pricing");
      return getFallbackPricing(mailSpecs);
    }
    try {
      const pricingData = await getLobPricing(mailSpecs);
      return pricingData;
    } catch (lobError) {
      console.warn("Lob API pricing failed, using fallback:", lobError);
      return getFallbackPricing(mailSpecs);
    }
  } catch (error) {
    console.error("Lob cost calculation error:", error);
    throw new HttpError(500, "Failed to calculate mail cost");
  }
}
async function getLobPricing(mailSpecs) {
  if (!lob) {
    throw new Error("Lob client not initialized");
  }
  const mailpieceData = {
    to: {
      name: mailSpecs.toAddress.name || "Test Recipient",
      address_line1: mailSpecs.toAddress.address_line1,
      address_line2: mailSpecs.toAddress.address_line2,
      city: mailSpecs.toAddress.city,
      state: mailSpecs.toAddress.state,
      zip_code: mailSpecs.toAddress.zip_code,
      country: mailSpecs.toAddress.country || "US"
    },
    from: {
      name: mailSpecs.fromAddress.name || "Test Sender",
      address_line1: mailSpecs.fromAddress.address_line1,
      address_line2: mailSpecs.fromAddress.address_line2,
      city: mailSpecs.fromAddress.city,
      state: mailSpecs.fromAddress.state,
      zip_code: mailSpecs.fromAddress.zip_code,
      country: mailSpecs.fromAddress.country || "US"
    },
    // Use test content for pricing calculation
    description: "Pricing calculation - test mailpiece"
  };
  let pricingResponse;
  try {
    if (!lob) {
      console.warn("Lob client not available, using mock pricing");
      return {
        cost: Math.round(0.6 * 100),
        // 60 cents in cents
        currency: "USD",
        breakdown: {
          baseCost: 0.6,
          multiplier: 1,
          mailType: mailSpecs.mailType,
          mailClass: mailSpecs.mailClass,
          mailSize: mailSpecs.mailSize
        }
      };
    }
    if (mailSpecs.mailType === "postcard") {
      pricingResponse = await lob.postcards.create({
        ...mailpieceData,
        front: "https://s3.amazonaws.com/lob-assets/postcard-front.pdf",
        // Test template
        back: "https://s3.amazonaws.com/lob-assets/postcard-back.pdf",
        // Test template
        size: mailSpecs.mailSize === "4x6" ? "4x6" : "6x9"
      });
    } else if (mailSpecs.mailType === "letter") {
      pricingResponse = await lob.letters.create({
        ...mailpieceData,
        file: "<html><body><h1>Test Letter</h1><p>This is a test letter for pricing calculation.</p></body></html>",
        color: true,
        double_sided: false
      });
    } else {
      pricingResponse = await lob.letters.create({
        ...mailpieceData,
        file: "<html><body><h1>Test Mail</h1><p>This is a test mailpiece for pricing calculation.</p></body></html>",
        color: true,
        double_sided: false
      });
    }
    const costInDollars = parseFloat(pricingResponse.price || "0.60");
    const costInCents = Math.round(costInDollars * 100);
    return {
      cost: costInCents,
      currency: "USD",
      breakdown: {
        baseCost: costInDollars,
        multiplier: 1,
        mailType: mailSpecs.mailType,
        mailClass: mailSpecs.mailClass,
        mailSize: mailSpecs.mailSize,
        lobId: pricingResponse.id,
        lobPrice: pricingResponse.price
      }
    };
  } catch (error) {
    console.error("Lob API pricing request failed:", error);
    throw error;
  }
}
function getFallbackPricing(mailSpecs) {
  const baseCosts = {
    "postcard": 0.5,
    "letter": 0.6,
    "check": 0.6,
    "self_mailer": 0.6,
    "catalog": 0.6,
    "booklet": 0.6
  };
  const classMultipliers = {
    "usps_first_class": 1,
    "usps_standard": 0.8,
    "usps_express": 2,
    "usps_priority": 1.5
  };
  const baseCost = baseCosts[mailSpecs.mailType] || 0.6;
  const multiplier = classMultipliers[mailSpecs.mailClass] || 1;
  const cost = baseCost * multiplier;
  return {
    cost: Math.round(cost * 100),
    // Convert to cents
    currency: "USD",
    breakdown: {
      baseCost,
      multiplier,
      mailType: mailSpecs.mailType,
      mailClass: mailSpecs.mailClass,
      mailSize: mailSpecs.mailSize,
      fallback: true
      // Indicate this is fallback pricing
    }
  };
}
async function createMailPiece$3(mailData) {
  try {
    const lobApiKey = process.env.LOB_TEST_KEY || process.env.LOB_PROD_KEY;
    if (!lobApiKey || !lob) {
      console.warn("Lob API key not configured, using simulation mode");
      const mockLobId = `lob_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return {
        id: mockLobId,
        status: "submitted",
        trackingNumber: `TRK${Date.now()}`,
        estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1e3),
        // 3 days from now
        cost: 60
        // 60 cents
      };
    }
    const mailpieceData = {
      to: {
        name: mailData.to.contactName || mailData.to.name || "Recipient",
        address_line1: mailData.to.addressLine1 || mailData.to.address_line1,
        address_line2: mailData.to.addressLine2 || mailData.to.address_line2,
        city: mailData.to.city,
        state: mailData.to.state,
        zip_code: mailData.to.postalCode || mailData.to.zip_code,
        country: mailData.to.country || "US"
      },
      from: {
        name: mailData.from.contactName || mailData.from.name || "Sender",
        address_line1: mailData.from.addressLine1 || mailData.from.address_line1,
        address_line2: mailData.from.addressLine2 || mailData.from.address_line2,
        city: mailData.from.city,
        state: mailData.from.state,
        zip_code: mailData.from.postalCode || mailData.from.zip_code,
        country: mailData.from.country || "US"
      },
      description: mailData.description || "Mail piece created via Postmarkr"
    };
    let lobResponse;
    if (mailData.mailType === "postcard") {
      lobResponse = await lob.postcards.create({
        ...mailpieceData,
        front: mailData.fileUrl || "https://s3.amazonaws.com/lob-assets/postcard-front.pdf",
        // Use provided file or default
        back: "https://s3.amazonaws.com/lob-assets/postcard-back.pdf",
        // Default back template
        size: mailData.mailSize === "4x6" ? "4x6" : "6x9"
      });
    } else if (mailData.mailType === "letter") {
      const fileContent = mailData.fileUrl ? await fetchFileContent(mailData.fileUrl) : "<html><body><h1>Mail Letter</h1><p>This is a mail letter created via Postmarkr.</p></body></html>";
      lobResponse = await lob.letters.create({
        ...mailpieceData,
        file: fileContent,
        color: true,
        double_sided: false
      });
    } else {
      const fileContent = mailData.fileUrl ? await fetchFileContent(mailData.fileUrl) : "<html><body><h1>Mail Piece</h1><p>This is a mail piece created via Postmarkr.</p></body></html>";
      lobResponse = await lob.letters.create({
        ...mailpieceData,
        file: fileContent,
        color: true,
        double_sided: false
      });
    }
    const costInDollars = parseFloat(lobResponse.price || "0.60");
    const costInCents = Math.round(costInDollars * 100);
    return {
      id: lobResponse.id,
      status: lobResponse.status || "submitted",
      trackingNumber: lobResponse.tracking_number || `TRK${lobResponse.id}`,
      estimatedDeliveryDate: lobResponse.expected_delivery_date ? new Date(lobResponse.expected_delivery_date) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1e3),
      // Default 3 days
      cost: costInCents,
      lobData: lobResponse
      // Store full response for reference
    };
  } catch (error) {
    console.error("Lob mail creation error:", error);
    if (error && typeof error === "object" && "message" in error) {
      const errorMessage = error.message;
      if (errorMessage.includes("address")) {
        throw new HttpError(400, "Invalid address format. Please check your address details.");
      } else if (errorMessage.includes("file")) {
        throw new HttpError(400, "Invalid file format. Please ensure your file is compatible with mail processing.");
      } else if (errorMessage.includes("rate limit")) {
        throw new HttpError(429, "Rate limit exceeded. Please try again later.");
      }
    }
    throw new HttpError(500, "Failed to create mail piece with Lob API");
  }
}
async function fetchFileContent(fileUrl) {
  try {
    return "<html><body><h1>Mail Content</h1><p>This is the content of your mail piece.</p></body></html>";
  } catch (error) {
    console.error("Error fetching file content:", error);
    return "<html><body><h1>Mail Content</h1><p>This is the content of your mail piece.</p></body></html>";
  }
}
async function getMailPieceStatus(lobId) {
  try {
    const lobApiKey = process.env.LOB_TEST_KEY || process.env.LOB_PROD_KEY;
    if (!lobApiKey || !lob) {
      console.warn("Lob API key not configured, using simulation mode");
      const statuses = ["submitted", "in_transit", "delivered", "returned"];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      return {
        id: lobId,
        status: randomStatus,
        trackingNumber: `TRK${lobId.split("_")[1]}`,
        estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1e3),
        events: [
          {
            timestamp: /* @__PURE__ */ new Date(),
            status: randomStatus,
            description: `Mail piece ${randomStatus}`
          }
        ]
      };
    }
    let lobResponse;
    let mailType = "unknown";
    try {
      lobResponse = await lob.postcards.retrieve(lobId);
      mailType = "postcard";
    } catch (postcardError) {
      try {
        lobResponse = await lob.letters.retrieve(lobId);
        mailType = "letter";
      } catch (letterError) {
        try {
          lobResponse = await lob.checks.retrieve(lobId);
          mailType = "check";
        } catch (checkError) {
          throw new Error("Mail piece not found in Lob API");
        }
      }
    }
    const status = lobResponse.status || "unknown";
    const trackingNumber = lobResponse.tracking_number || `TRK${lobId}`;
    const estimatedDeliveryDate = lobResponse.expected_delivery_date ? new Date(lobResponse.expected_delivery_date) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1e3);
    const events = [];
    if (lobResponse.events && Array.isArray(lobResponse.events)) {
      events.push(...lobResponse.events.map((event) => ({
        timestamp: new Date(event.date_created || Date.now()),
        status: event.name || status,
        description: event.description || `Mail piece ${status}`
      })));
    } else {
      events.push({
        timestamp: /* @__PURE__ */ new Date(),
        status,
        description: `Mail piece ${status}`
      });
    }
    return {
      id: lobId,
      status,
      trackingNumber,
      estimatedDeliveryDate,
      events,
      mailType,
      lobData: lobResponse
      // Store full response for reference
    };
  } catch (error) {
    console.error("Lob status retrieval error:", error);
    if (error && typeof error === "object" && "message" in error) {
      const errorMessage = error.message;
      if (errorMessage.includes("not found")) {
        throw new HttpError(404, "Mail piece not found in Lob API");
      } else if (errorMessage.includes("rate limit")) {
        throw new HttpError(429, "Rate limit exceeded. Please try again later.");
      }
    }
    throw new HttpError(500, "Failed to retrieve mail piece status from Lob API");
  }
}

async function createMailPaymentIntent$3(mailSpecs, userId, context) {
  try {
    const costData = await calculateCost(mailSpecs);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: costData.cost,
      // Amount in cents
      currency: costData.currency.toLowerCase(),
      metadata: {
        userId,
        mailType: mailSpecs.mailType,
        mailClass: mailSpecs.mailClass,
        mailSize: mailSpecs.mailSize,
        type: "mail_payment"
        // Note: mailPieceId will be added by the calling operation
      },
      automatic_payment_methods: {
        enabled: true
      }
    });
    return {
      paymentIntentId: paymentIntent.id,
      cost: costData.cost
    };
  } catch (error) {
    console.error("Error creating mail payment intent:", error);
    throw new HttpError(500, "Failed to create payment intent");
  }
}
async function confirmMailPayment$3(paymentIntentId, mailPieceId, context) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== "succeeded") {
      throw new HttpError(400, "Payment not completed");
    }
    await context.entities.MailPiece.update({
      where: { id: mailPieceId },
      data: {
        paymentStatus: "paid",
        paymentIntentId,
        status: "paid"
      }
    });
    await context.entities.MailPieceStatusHistory.create({
      data: {
        mailPieceId,
        status: "paid",
        previousStatus: "pending_payment",
        description: "Payment confirmed",
        source: "system"
      }
    });
    return true;
  } catch (error) {
    console.error("Error confirming mail payment:", error);
    throw new HttpError(500, "Failed to confirm payment");
  }
}
async function refundMailPayment$3(paymentIntentId, mailPieceId, reason, context) {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: "requested_by_customer",
      metadata: {
        mailPieceId,
        reason
      }
    });
    await context.entities.MailPiece.update({
      where: { id: mailPieceId },
      data: {
        paymentStatus: "refunded",
        status: "failed"
      }
    });
    await context.entities.MailPieceStatusHistory.create({
      data: {
        mailPieceId,
        status: "failed",
        previousStatus: "paid",
        description: `Payment refunded: ${reason}`,
        source: "system"
      }
    });
    return true;
  } catch (error) {
    console.error("Error processing mail refund:", error);
    throw new HttpError(500, "Failed to process refund");
  }
}

const getMailPieces$2 = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, "Not authorized");
  }
  const page = args.page || 1;
  const limit = Math.min(args.limit || 20, 100);
  const skip = (page - 1) * limit;
  const where = { userId: context.user.id };
  if (args.status && args.status !== "all") {
    where.status = args.status;
  }
  if (args.mailType && args.mailType !== "all") {
    where.mailType = args.mailType;
  }
  if (args.search) {
    where.OR = [
      { description: { contains: args.search, mode: "insensitive" } },
      { senderAddress: { contactName: { contains: args.search, mode: "insensitive" } } },
      { recipientAddress: { contactName: { contains: args.search, mode: "insensitive" } } }
    ];
  }
  const total = await context.entities.MailPiece.count({ where });
  const mailPieces = await context.entities.MailPiece.findMany({
    where,
    include: {
      senderAddress: true,
      recipientAddress: true,
      file: true,
      statusHistory: {
        orderBy: { createdAt: "desc" },
        take: 5
        // Get last 5 status updates
      }
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit
  });
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  return {
    mailPieces,
    total,
    page,
    totalPages,
    hasNext,
    hasPrev
  };
};
const createMailPiece$2 = async (args, context) => {
  try {
    if (!context.user) {
      throw new HttpError(401, validationErrors.UNAUTHORIZED);
    }
    const validatedInput = createMailPieceSchema.parse(args);
    const senderAddress = await context.entities.MailAddress.findFirst({
      where: { id: validatedInput.senderAddressId, userId: context.user.id }
    });
    if (!senderAddress) {
      throw new HttpError(400, validationErrors.ADDRESS_NOT_FOUND);
    }
    const recipientAddress = await context.entities.MailAddress.findFirst({
      where: { id: validatedInput.recipientAddressId, userId: context.user.id }
    });
    if (!recipientAddress) {
      throw new HttpError(400, validationErrors.ADDRESS_NOT_FOUND);
    }
    if (validatedInput.fileId) {
      const file = await context.entities.File.findFirst({
        where: { id: validatedInput.fileId, userId: context.user.id }
      });
      if (!file) {
        throw new HttpError(400, validationErrors.FILE_NOT_FOUND);
      }
    }
    const mailPiece = await context.entities.MailPiece.create({
      data: {
        userId: context.user.id,
        mailType: validatedInput.mailType,
        mailClass: validatedInput.mailClass,
        mailSize: validatedInput.mailSize,
        senderAddressId: validatedInput.senderAddressId,
        recipientAddressId: validatedInput.recipientAddressId,
        fileId: validatedInput.fileId,
        description: validatedInput.description,
        status: "draft",
        paymentStatus: "pending"
      }
    });
    await context.entities.MailPieceStatusHistory.create({
      data: {
        mailPieceId: mailPiece.id,
        status: "draft",
        description: "Mail piece created",
        source: "system"
      }
    });
    return mailPiece;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    if (error instanceof Error && error.name === "ZodError") {
      throw new HttpError(400, `Validation error: ${error.message}`);
    }
    console.error("Failed to create mail piece:", error);
    throw new HttpError(500, "Failed to create mail piece due to an internal error.");
  }
};
const updateMailPieceStatus$2 = async (args, context) => {
  try {
    const validatedInput = lobWebhookStatusSchema.parse(args);
    const mailPiece = await context.entities.MailPiece.findFirst({
      where: { lobId: validatedInput.lobId }
    });
    if (!mailPiece) {
      throw new HttpError(404, validationErrors.MAIL_PIECE_NOT_FOUND);
    }
    let newStatus = mailPiece.status;
    if (validatedInput.lobStatus) {
      const statusMapping = {
        "delivered": "delivered",
        "returned": "returned",
        "in_transit": "in_transit",
        "processing": "submitted",
        "printed": "submitted",
        "mailed": "submitted"
      };
      newStatus = statusMapping[validatedInput.lobStatus] || mailPiece.status;
    }
    const updatedMailPiece = await context.entities.MailPiece.update({
      where: { id: mailPiece.id },
      data: {
        lobStatus: validatedInput.lobStatus,
        lobTrackingNumber: validatedInput.lobTrackingNumber,
        metadata: validatedInput.lobData,
        status: newStatus
      }
    });
    await context.entities.MailPieceStatusHistory.create({
      data: {
        mailPieceId: mailPiece.id,
        status: newStatus,
        previousStatus: mailPiece.status,
        description: `Status updated from Lob: ${validatedInput.lobStatus}`,
        source: "webhook",
        lobData: validatedInput.lobData
      }
    });
    return updatedMailPiece;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    if (error instanceof Error && error.name === "ZodError") {
      throw new HttpError(400, `Validation error: ${error.message}`);
    }
    console.error("Failed to update mail piece status:", error);
    throw new HttpError(500, "Failed to update mail piece status due to an internal error.");
  }
};
const updateMailPiece$2 = async (args, context) => {
  try {
    if (!context.user) {
      throw new HttpError(401, validationErrors.UNAUTHORIZED);
    }
    const validatedInput = updateMailPieceSchema.parse(args);
    const mailPiece = await context.entities.MailPiece.findFirst({
      where: { id: validatedInput.id, userId: context.user.id }
    });
    if (!mailPiece) {
      throw new HttpError(404, validationErrors.MAIL_PIECE_NOT_FOUND);
    }
    if (mailPiece.status !== "draft") {
      throw new HttpError(400, "Mail piece can only be updated in draft status");
    }
    if (validatedInput.senderAddressId) {
      const senderAddress = await context.entities.MailAddress.findFirst({
        where: { id: validatedInput.senderAddressId, userId: context.user.id }
      });
      if (!senderAddress) {
        throw new HttpError(400, validationErrors.ADDRESS_NOT_FOUND);
      }
    }
    if (validatedInput.recipientAddressId) {
      const recipientAddress = await context.entities.MailAddress.findFirst({
        where: { id: validatedInput.recipientAddressId, userId: context.user.id }
      });
      if (!recipientAddress) {
        throw new HttpError(400, validationErrors.ADDRESS_NOT_FOUND);
      }
    }
    if (validatedInput.fileId) {
      const file = await context.entities.File.findFirst({
        where: { id: validatedInput.fileId, userId: context.user.id }
      });
      if (!file) {
        throw new HttpError(400, validationErrors.FILE_NOT_FOUND);
      }
    }
    const updatedMailPiece = await context.entities.MailPiece.update({
      where: { id: validatedInput.id },
      data: {
        mailType: validatedInput.mailType,
        mailClass: validatedInput.mailClass,
        mailSize: validatedInput.mailSize,
        senderAddressId: validatedInput.senderAddressId,
        recipientAddressId: validatedInput.recipientAddressId,
        fileId: validatedInput.fileId,
        description: validatedInput.description
      }
    });
    await context.entities.MailPieceStatusHistory.create({
      data: {
        mailPieceId: updatedMailPiece.id,
        status: "draft",
        description: "Mail piece updated",
        source: "user"
      }
    });
    return updatedMailPiece;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    if (error instanceof Error && error.name === "ZodError") {
      throw new HttpError(400, `Validation error: ${error.message}`);
    }
    console.error("Failed to update mail piece:", error);
    throw new HttpError(500, "Failed to update mail piece due to an internal error.");
  }
};
const deleteMailPiece$2 = async (args, context) => {
  try {
    if (!context.user) {
      throw new HttpError(401, validationErrors.UNAUTHORIZED);
    }
    const mailPiece = await context.entities.MailPiece.findFirst({
      where: { id: args.id, userId: context.user.id }
    });
    if (!mailPiece) {
      throw new HttpError(404, validationErrors.MAIL_PIECE_NOT_FOUND);
    }
    if (mailPiece.status !== "draft") {
      throw new HttpError(400, "Mail piece can only be deleted in draft status");
    }
    await context.entities.MailPiece.delete({
      where: { id: args.id }
    });
    return { success: true };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    console.error("Failed to delete mail piece:", error);
    throw new HttpError(500, "Failed to delete mail piece due to an internal error.");
  }
};
const getMailPiece$2 = async (args, context) => {
  try {
    if (!context.user) {
      throw new HttpError(401, validationErrors.UNAUTHORIZED);
    }
    const mailPiece = await context.entities.MailPiece.findFirst({
      where: { id: args.id, userId: context.user.id },
      include: {
        senderAddress: true,
        recipientAddress: true,
        file: true,
        statusHistory: {
          orderBy: { createdAt: "desc" }
        }
      }
    });
    return mailPiece;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    console.error("Failed to get mail piece:", error);
    throw new HttpError(500, "Failed to get mail piece due to an internal error.");
  }
};
const createMailPaymentIntent$2 = async (args, context) => {
  try {
    if (!context.user) {
      throw new HttpError(401, validationErrors.UNAUTHORIZED);
    }
    const mailPiece = await context.entities.MailPiece.findFirst({
      where: { id: args.mailPieceId, userId: context.user.id },
      include: {
        senderAddress: true,
        recipientAddress: true
      }
    });
    if (!mailPiece) {
      throw new HttpError(404, validationErrors.MAIL_PIECE_NOT_FOUND);
    }
    if (mailPiece.status !== "draft") {
      throw new HttpError(400, "Payment can only be created for draft mail pieces");
    }
    const paymentData = await createMailPaymentIntent$3({
      mailType: mailPiece.mailType,
      mailClass: mailPiece.mailClass,
      mailSize: mailPiece.mailSize,
      toAddress: mailPiece.recipientAddress,
      fromAddress: mailPiece.senderAddress
    }, context.user.id, context);
    const stripeClient = require("../../payment/stripe/stripeClient").stripe;
    await stripeClient.paymentIntents.update(paymentData.paymentIntentId, {
      metadata: {
        mailPieceId: args.mailPieceId,
        userId: context.user.id,
        mailType: mailPiece.mailType,
        mailClass: mailPiece.mailClass,
        mailSize: mailPiece.mailSize,
        type: "mail_payment"
      }
    });
    await context.entities.MailPiece.update({
      where: { id: args.mailPieceId },
      data: {
        paymentIntentId: paymentData.paymentIntentId,
        cost: paymentData.cost / 100,
        // Convert to USD for display
        status: "pending_payment"
      }
    });
    await context.entities.MailPieceStatusHistory.create({
      data: {
        mailPieceId: args.mailPieceId,
        status: "pending_payment",
        previousStatus: "draft",
        description: "Payment intent created",
        source: "system"
      }
    });
    const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentData.paymentIntentId);
    return {
      paymentIntentId: paymentData.paymentIntentId,
      cost: paymentData.cost,
      clientSecret: paymentIntent.client_secret
    };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    console.error("Failed to create mail payment intent:", error);
    throw new HttpError(500, "Failed to create payment intent due to an internal error.");
  }
};
const createMailCheckoutSession$2 = async (args, context) => {
  try {
    if (!context.user) {
      throw new HttpError(401, validationErrors.UNAUTHORIZED);
    }
    const mailPiece = await context.entities.MailPiece.findFirst({
      where: { id: args.mailPieceId, userId: context.user.id },
      include: {
        senderAddress: true,
        recipientAddress: true
      }
    });
    if (!mailPiece) {
      throw new HttpError(404, validationErrors.MAIL_PIECE_NOT_FOUND);
    }
    if (mailPiece.status !== "draft") {
      throw new HttpError(400, "Checkout can only be created for draft mail pieces");
    }
    const costData = await createMailPaymentIntent$3({
      mailType: mailPiece.mailType,
      mailClass: mailPiece.mailClass,
      mailSize: mailPiece.mailSize,
      toAddress: mailPiece.recipientAddress,
      fromAddress: mailPiece.senderAddress
    }, context.user.id, context);
    const stripe = require("../../payment/stripe/stripeClient").stripe;
    const DOMAIN = process.env.WASP_WEB_CLIENT_URL || "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Mail Piece - ${mailPiece.mailType}`,
              description: `Send ${mailPiece.mailType} via ${mailPiece.mailClass} mail`
            },
            unit_amount: costData.cost
            // Amount in cents
          },
          quantity: 1
        }
      ],
      mode: "payment",
      success_url: `${DOMAIN}/mail/checkout?status=success&mail_piece_id=${args.mailPieceId}`,
      cancel_url: `${DOMAIN}/mail/checkout?status=canceled&mail_piece_id=${args.mailPieceId}`,
      metadata: {
        mailPieceId: args.mailPieceId,
        userId: context.user.id,
        mailType: mailPiece.mailType,
        mailClass: mailPiece.mailClass,
        mailSize: mailPiece.mailSize,
        type: "mail_payment"
      },
      customer_email: context.user.email
    });
    if (!session.url) {
      throw new HttpError(500, "Failed to create checkout session URL");
    }
    await context.entities.MailPiece.update({
      where: { id: args.mailPieceId },
      data: {
        paymentIntentId: session.id,
        // Store session ID for reference
        status: "pending_payment"
      }
    });
    await context.entities.MailPieceStatusHistory.create({
      data: {
        mailPieceId: args.mailPieceId,
        status: "pending_payment",
        previousStatus: "draft",
        description: "Checkout session created",
        source: "system"
      }
    });
    return {
      sessionUrl: session.url,
      sessionId: session.id
    };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    console.error("Failed to create mail checkout session:", error);
    throw new HttpError(500, "Failed to create checkout session due to an internal error.");
  }
};
const confirmMailPayment$2 = async (args, context) => {
  try {
    if (!context.user) {
      throw new HttpError(401, validationErrors.UNAUTHORIZED);
    }
    const mailPiece = await context.entities.MailPiece.findFirst({
      where: { id: args.mailPieceId, userId: context.user.id }
    });
    if (!mailPiece) {
      throw new HttpError(404, validationErrors.MAIL_PIECE_NOT_FOUND);
    }
    if (mailPiece.paymentIntentId !== args.paymentIntentId) {
      throw new HttpError(400, "Payment intent does not match mail piece");
    }
    const success = await confirmMailPayment$3(args.paymentIntentId, args.mailPieceId, context);
    return { success };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    console.error("Failed to confirm mail payment:", error);
    throw new HttpError(500, "Failed to confirm payment due to an internal error.");
  }
};
const refundMailPayment$2 = async (args, context) => {
  try {
    if (!context.user) {
      throw new HttpError(401, validationErrors.UNAUTHORIZED);
    }
    const mailPiece = await context.entities.MailPiece.findFirst({
      where: { id: args.mailPieceId, userId: context.user.id }
    });
    if (!mailPiece) {
      throw new HttpError(404, validationErrors.MAIL_PIECE_NOT_FOUND);
    }
    if (mailPiece.paymentStatus !== "paid") {
      throw new HttpError(400, "Refund can only be processed for paid mail pieces");
    }
    if (!mailPiece.paymentIntentId) {
      throw new HttpError(400, "No payment intent found for this mail piece");
    }
    const success = await refundMailPayment$3(mailPiece.paymentIntentId, args.mailPieceId, args.reason, context);
    return { success };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    console.error("Failed to refund mail payment:", error);
    throw new HttpError(500, "Failed to process refund due to an internal error.");
  }
};
const submitMailPieceToLob$2 = async (args, context) => {
  try {
    if (!context.user) {
      throw new HttpError(401, validationErrors.UNAUTHORIZED);
    }
    const mailPiece = await context.entities.MailPiece.findFirst({
      where: { id: args.mailPieceId, userId: context.user.id },
      include: {
        senderAddress: true,
        recipientAddress: true,
        file: true
      }
    });
    if (!mailPiece) {
      throw new HttpError(404, validationErrors.MAIL_PIECE_NOT_FOUND);
    }
    if (mailPiece.paymentStatus !== "paid") {
      throw new HttpError(400, "Mail piece must be paid before submission to Lob");
    }
    if (mailPiece.lobId) {
      throw new HttpError(400, "Mail piece already submitted to Lob");
    }
    const lobMailData = {
      to: mailPiece.recipientAddress,
      from: mailPiece.senderAddress,
      mailType: mailPiece.mailType,
      mailClass: mailPiece.mailClass,
      mailSize: mailPiece.mailSize,
      fileUrl: mailPiece.file?.uploadUrl,
      description: mailPiece.description || `Mail piece created via Postmarkr - ${mailPiece.mailType}`
    };
    const lobResponse = await createMailPiece$3(lobMailData);
    await context.entities.MailPiece.update({
      where: { id: args.mailPieceId },
      data: {
        lobId: lobResponse.id,
        lobStatus: lobResponse.status,
        lobTrackingNumber: lobResponse.trackingNumber,
        status: "submitted",
        cost: lobResponse.cost / 100,
        // Convert to USD for display
        metadata: {
          lobData: lobResponse.lobData,
          submittedAt: (/* @__PURE__ */ new Date()).toISOString()
        }
      }
    });
    await context.entities.MailPieceStatusHistory.create({
      data: {
        mailPieceId: args.mailPieceId,
        status: "submitted",
        previousStatus: "paid",
        description: `Submitted to Lob API - ID: ${lobResponse.id}`,
        source: "system",
        lobData: {
          lobId: lobResponse.id,
          lobStatus: lobResponse.status,
          trackingNumber: lobResponse.trackingNumber,
          submittedAt: (/* @__PURE__ */ new Date()).toISOString()
        }
      }
    });
    console.log(`Successfully submitted mail piece ${args.mailPieceId} to Lob with ID: ${lobResponse.id}`);
    return {
      success: true,
      lobId: lobResponse.id
    };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    console.error("Failed to submit mail piece to Lob:", error);
    throw new HttpError(500, "Failed to submit mail piece to Lob due to an internal error.");
  }
};
const syncMailPieceStatus$2 = async (args, context) => {
  try {
    if (!context.user) {
      throw new HttpError(401, validationErrors.UNAUTHORIZED);
    }
    const mailPiece = await context.entities.MailPiece.findFirst({
      where: { id: args.mailPieceId, userId: context.user.id }
    });
    if (!mailPiece) {
      throw new HttpError(404, validationErrors.MAIL_PIECE_NOT_FOUND);
    }
    if (!mailPiece.lobId) {
      throw new HttpError(400, "Mail piece has not been submitted to Lob yet");
    }
    const lobStatus = await getMailPieceStatus(mailPiece.lobId);
    const statusMapping = {
      "delivered": "delivered",
      "returned": "returned",
      "in_transit": "in_transit",
      "processing": "submitted",
      "printed": "submitted",
      "mailed": "submitted",
      "created": "submitted",
      "cancelled": "failed",
      "failed": "failed"
    };
    const newStatus = statusMapping[lobStatus.status] || lobStatus.status || mailPiece.status;
    if (newStatus !== mailPiece.status) {
      await context.entities.MailPiece.update({
        where: { id: args.mailPieceId },
        data: {
          status: newStatus,
          lobStatus: lobStatus.status,
          lobTrackingNumber: lobStatus.trackingNumber,
          metadata: {
            ...mailPiece.metadata && typeof mailPiece.metadata === "object" ? mailPiece.metadata : {},
            lastSyncedAt: (/* @__PURE__ */ new Date()).toISOString(),
            lobData: lobStatus.lobData || {}
          }
        }
      });
      await context.entities.MailPieceStatusHistory.create({
        data: {
          mailPieceId: args.mailPieceId,
          status: newStatus,
          previousStatus: mailPiece.status,
          description: `Status synced from Lob: ${lobStatus.status}`,
          source: "system",
          lobData: {
            lobStatus: lobStatus.status,
            trackingNumber: lobStatus.trackingNumber,
            syncedAt: (/* @__PURE__ */ new Date()).toISOString()
          }
        }
      });
      console.log(`Successfully synced mail piece ${args.mailPieceId} status: ${mailPiece.status} -> ${newStatus}`);
    }
    return {
      success: true,
      status: newStatus
    };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    console.error("Failed to sync mail piece status from Lob:", error);
    throw new HttpError(500, "Failed to sync mail piece status from Lob due to an internal error.");
  }
};
const bulkDeleteMailPieces$2 = async (args, context) => {
  try {
    if (!context.user) {
      throw new HttpError(401, "Not authorized");
    }
    if (!args.mailPieceIds || args.mailPieceIds.length === 0) {
      throw new HttpError(400, "No mail piece IDs provided");
    }
    if (args.mailPieceIds.length > 50) {
      throw new HttpError(400, "Cannot delete more than 50 mail pieces at once");
    }
    const deletedIds = [];
    const failedIds = [];
    for (const mailPieceId of args.mailPieceIds) {
      try {
        const mailPiece = await context.entities.MailPiece.findFirst({
          where: {
            id: mailPieceId,
            userId: context.user.id,
            status: "draft"
            // Only allow deletion of draft mail pieces
          }
        });
        if (!mailPiece) {
          failedIds.push(mailPieceId);
          continue;
        }
        await context.entities.MailPiece.delete({
          where: { id: mailPieceId }
        });
        deletedIds.push(mailPieceId);
      } catch (error) {
        console.error(`Failed to delete mail piece ${mailPieceId}:`, error);
        failedIds.push(mailPieceId);
      }
    }
    return {
      deletedCount: deletedIds.length,
      failedIds
    };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    console.error("Failed to bulk delete mail pieces:", error);
    throw new HttpError(500, "Failed to bulk delete mail pieces due to an internal error.");
  }
};

async function createMailPiece$1(args, context) {
  return createMailPiece$2(args, {
    ...context,
    entities: {
      MailPiece: dbClient.mailPiece,
      MailAddress: dbClient.mailAddress,
      File: dbClient.file,
      MailPieceStatusHistory: dbClient.mailPieceStatusHistory
    }
  });
}

var createMailPiece = createAction(createMailPiece$1);

async function updateMailPiece$1(args, context) {
  return updateMailPiece$2(args, {
    ...context,
    entities: {
      MailPiece: dbClient.mailPiece,
      MailAddress: dbClient.mailAddress,
      File: dbClient.file,
      MailPieceStatusHistory: dbClient.mailPieceStatusHistory
    }
  });
}

var updateMailPiece = createAction(updateMailPiece$1);

async function deleteMailPiece$1(args, context) {
  return deleteMailPiece$2(args, {
    ...context,
    entities: {
      MailPiece: dbClient.mailPiece,
      MailPieceStatusHistory: dbClient.mailPieceStatusHistory
    }
  });
}

var deleteMailPiece = createAction(deleteMailPiece$1);

async function updateMailPieceStatus$1(args, context) {
  return updateMailPieceStatus$2(args, {
    ...context,
    entities: {
      MailPiece: dbClient.mailPiece,
      MailPieceStatusHistory: dbClient.mailPieceStatusHistory
    }
  });
}

var updateMailPieceStatus = createAction(updateMailPieceStatus$1);

async function createMailPaymentIntent$1(args, context) {
  return createMailPaymentIntent$2(args, {
    ...context,
    entities: {
      MailPiece: dbClient.mailPiece,
      MailAddress: dbClient.mailAddress,
      MailPieceStatusHistory: dbClient.mailPieceStatusHistory
    }
  });
}

var createMailPaymentIntent = createAction(createMailPaymentIntent$1);

async function createMailCheckoutSession$1(args, context) {
  return createMailCheckoutSession$2(args, {
    ...context,
    entities: {
      MailPiece: dbClient.mailPiece,
      MailAddress: dbClient.mailAddress,
      MailPieceStatusHistory: dbClient.mailPieceStatusHistory
    }
  });
}

var createMailCheckoutSession = createAction(createMailCheckoutSession$1);

async function confirmMailPayment$1(args, context) {
  return confirmMailPayment$2(args, {
    ...context,
    entities: {
      MailPiece: dbClient.mailPiece,
      MailPieceStatusHistory: dbClient.mailPieceStatusHistory
    }
  });
}

var confirmMailPayment = createAction(confirmMailPayment$1);

async function refundMailPayment$1(args, context) {
  return refundMailPayment$2(args, {
    ...context,
    entities: {
      MailPiece: dbClient.mailPiece,
      MailPieceStatusHistory: dbClient.mailPieceStatusHistory
    }
  });
}

var refundMailPayment = createAction(refundMailPayment$1);

async function submitMailPieceToLob$1(args, context) {
  return submitMailPieceToLob$2(args, {
    ...context,
    entities: {
      MailPiece: dbClient.mailPiece,
      MailAddress: dbClient.mailAddress,
      File: dbClient.file,
      MailPieceStatusHistory: dbClient.mailPieceStatusHistory
    }
  });
}

var submitMailPieceToLob = createAction(submitMailPieceToLob$1);

async function syncMailPieceStatus$1(args, context) {
  return syncMailPieceStatus$2(args, {
    ...context,
    entities: {
      MailPiece: dbClient.mailPiece,
      MailPieceStatusHistory: dbClient.mailPieceStatusHistory
    }
  });
}

var syncMailPieceStatus = createAction(syncMailPieceStatus$1);

async function bulkDeleteMailPieces$1(args, context) {
  return bulkDeleteMailPieces$2(args, {
    ...context,
    entities: {
      MailPiece: dbClient.mailPiece,
      MailPieceStatusHistory: dbClient.mailPieceStatusHistory
    }
  });
}

var bulkDeleteMailPieces = createAction(bulkDeleteMailPieces$1);

async function getPaginatedUsers$1(args, context) {
  return getPaginatedUsers$2(args, {
    ...context,
    entities: {
      User: dbClient.user
    }
  });
}

var getPaginatedUsers = createQuery(getPaginatedUsers$1);

async function getGptResponses$1(args, context) {
  return getGptResponses$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      GptResponse: dbClient.gptResponse
    }
  });
}

var getGptResponses = createQuery(getGptResponses$1);

async function getAllTasksByUser$1(args, context) {
  return getAllTasksByUser$2(args, {
    ...context,
    entities: {
      Task: dbClient.task
    }
  });
}

var getAllTasksByUser = createQuery(getAllTasksByUser$1);

async function getCustomerPortalUrl$1(args, context) {
  return getCustomerPortalUrl$2(args, {
    ...context,
    entities: {
      User: dbClient.user
    }
  });
}

var getCustomerPortalUrl = createQuery(getCustomerPortalUrl$1);

async function getAllFilesByUser$1(args, context) {
  return getAllFilesByUser$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      File: dbClient.file
    }
  });
}

var getAllFilesByUser = createQuery(getAllFilesByUser$1);

async function getDownloadFileSignedURL$1(args, context) {
  return getDownloadFileSignedURL$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      File: dbClient.file
    }
  });
}

var getDownloadFileSignedURL = createQuery(getDownloadFileSignedURL$1);

async function getMailAddressesByUser$1(args, context) {
  return getMailAddressesByUser$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      MailAddress: dbClient.mailAddress
    }
  });
}

var getMailAddressesByUser = createQuery(getMailAddressesByUser$1);

const getDailyStats$2 = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401, "Only authenticated users are allowed to perform this operation");
  }
  if (!context.user.isAdmin) {
    throw new HttpError(403, "Only admins are allowed to perform this operation");
  }
  const statsQuery = {
    orderBy: {
      date: "desc"
    },
    include: {
      sources: true
    }
  };
  const [dailyStats, weeklyStats] = await dbClient.$transaction([
    context.entities.DailyStats.findFirst(statsQuery),
    context.entities.DailyStats.findMany({ ...statsQuery, take: 7 })
  ]);
  if (!dailyStats) {
    console.log("\x1B[34mNote: No daily stats have been generated by the dailyStatsJob yet. \x1B[0m");
    return void 0;
  }
  return { dailyStats, weeklyStats };
};

async function getDailyStats$1(args, context) {
  return getDailyStats$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      DailyStats: dbClient.dailyStats
    }
  });
}

var getDailyStats = createQuery(getDailyStats$1);

async function getMailPieces$1(args, context) {
  return getMailPieces$2(args, {
    ...context,
    entities: {
      MailPiece: dbClient.mailPiece,
      MailAddress: dbClient.mailAddress,
      File: dbClient.file,
      MailPieceStatusHistory: dbClient.mailPieceStatusHistory
    }
  });
}

var getMailPieces = createQuery(getMailPieces$1);

async function getMailPiece$1(args, context) {
  return getMailPiece$2(args, {
    ...context,
    entities: {
      MailPiece: dbClient.mailPiece,
      MailAddress: dbClient.mailAddress,
      File: dbClient.file,
      MailPieceStatusHistory: dbClient.mailPieceStatusHistory
    }
  });
}

var getMailPiece = createQuery(getMailPiece$1);

const router$4 = express.Router();
router$4.post("/update-is-user-admin-by-id", auth, updateIsUserAdminById);
router$4.post("/generate-gpt-response", auth, generateGptResponse);
router$4.post("/create-task", auth, createTask);
router$4.post("/delete-task", auth, deleteTask);
router$4.post("/update-task", auth, updateTask);
router$4.post("/generate-checkout-session", auth, generateCheckoutSession);
router$4.post("/create-file", auth, createFile);
router$4.post("/delete-file", auth, deleteFile);
router$4.post("/create-mail-address", auth, createMailAddress);
router$4.post("/update-mail-address", auth, updateMailAddress);
router$4.post("/delete-mail-address", auth, deleteMailAddress);
router$4.post("/set-default-address", auth, setDefaultAddress);
router$4.post("/create-mail-piece", auth, createMailPiece);
router$4.post("/update-mail-piece", auth, updateMailPiece);
router$4.post("/delete-mail-piece", auth, deleteMailPiece);
router$4.post("/update-mail-piece-status", auth, updateMailPieceStatus);
router$4.post("/create-mail-payment-intent", auth, createMailPaymentIntent);
router$4.post("/create-mail-checkout-session", auth, createMailCheckoutSession);
router$4.post("/confirm-mail-payment", auth, confirmMailPayment);
router$4.post("/refund-mail-payment", auth, refundMailPayment);
router$4.post("/submit-mail-piece-to-lob", auth, submitMailPieceToLob);
router$4.post("/sync-mail-piece-status", auth, syncMailPieceStatus);
router$4.post("/bulk-delete-mail-pieces", auth, bulkDeleteMailPieces);
router$4.post("/get-paginated-users", auth, getPaginatedUsers);
router$4.post("/get-gpt-responses", auth, getGptResponses);
router$4.post("/get-all-tasks-by-user", auth, getAllTasksByUser);
router$4.post("/get-customer-portal-url", auth, getCustomerPortalUrl);
router$4.post("/get-all-files-by-user", auth, getAllFilesByUser);
router$4.post("/get-download-file-signed-url", auth, getDownloadFileSignedURL);
router$4.post("/get-mail-addresses-by-user", auth, getMailAddressesByUser);
router$4.post("/get-daily-stats", auth, getDailyStats);
router$4.post("/get-mail-pieces", auth, getMailPieces);
router$4.post("/get-mail-piece", auth, getMailPiece);

const _waspGlobalMiddlewareConfigFn = (mc) => mc;
const defaultGlobalMiddlewareConfig = /* @__PURE__ */ new Map([
  ["helmet", helmet()],
  ["cors", cors({ origin: config$1.allowedCORSOrigins })],
  ["logger", logger("dev")],
  ["express.json", express.json()],
  ["express.urlencoded", express.urlencoded()],
  ["cookieParser", cookieParser()]
]);
const globalMiddlewareConfig = _waspGlobalMiddlewareConfigFn(defaultGlobalMiddlewareConfig);
function globalMiddlewareConfigForExpress(middlewareConfigFn) {
  if (!middlewareConfigFn) {
    return Array.from(globalMiddlewareConfig.values());
  }
  const globalMiddlewareConfigClone = new Map(globalMiddlewareConfig);
  const modifiedMiddlewareConfig = middlewareConfigFn(globalMiddlewareConfigClone);
  return Array.from(modifiedMiddlewareConfig.values());
}

var me = defineHandler(async (req, res) => {
  if (req.user) {
    res.json(serialize(req.user));
  } else {
    res.json(serialize(null));
  }
});

var logout = defineHandler(async (req, res) => {
  if (req.sessionId) {
    await invalidateSession(req.sessionId);
    res.json({ success: true });
  } else {
    throw createInvalidCredentialsError();
  }
});

const onBeforeSignupHook = async (_params) => {
};
const onAfterSignupHook = async (_params) => {
};
const onAfterEmailVerifiedHook = async (_params) => {
};
const onBeforeLoginHook = async (_params) => {
};
const onAfterLoginHook = async (_params) => {
};

function getLoginRoute() {
  return async function login(req, res) {
    const fields = req.body ?? {};
    ensureValidArgs$2(fields);
    const providerId = createProviderId("email", fields.email);
    const authIdentity = await findAuthIdentity(providerId);
    if (!authIdentity) {
      throw createInvalidCredentialsError();
    }
    const providerData = getProviderDataWithPassword(authIdentity.providerData);
    if (!providerData.isEmailVerified) {
      throw createInvalidCredentialsError();
    }
    try {
      await verifyPassword(providerData.hashedPassword, fields.password);
    } catch (e) {
      throw createInvalidCredentialsError();
    }
    const auth = await findAuthWithUserBy({ id: authIdentity.authId });
    if (auth === null) {
      throw createInvalidCredentialsError();
    }
    await onBeforeLoginHook({
      user: auth.user
    });
    const session = await createSession(auth.id);
    await onAfterLoginHook({
      user: auth.user
    });
    res.json({
      sessionId: session.id
    });
  };
}
function ensureValidArgs$2(args) {
  ensureValidEmail(args);
  ensurePasswordIsPresent(args);
}

const JWT_SECRET = new TextEncoder().encode(config$1.auth.jwtSecret);
const JWT_ALGORITHM = "HS256";
function createJWT(data, options) {
  return jwt.createJWT(JWT_ALGORITHM, JWT_SECRET, data, options);
}
async function validateJWT(token) {
  const { payload } = await jwt.validateJWT(JWT_ALGORITHM, JWT_SECRET, token);
  return payload;
}

async function createEmailVerificationLink(email, clientRoute) {
  const { jwtToken } = await createEmailJWT(email);
  return `${config$1.frontendUrl}${clientRoute}?token=${jwtToken}`;
}
async function createPasswordResetLink(email, clientRoute) {
  const { jwtToken } = await createEmailJWT(email);
  return `${config$1.frontendUrl}${clientRoute}?token=${jwtToken}`;
}
async function createEmailJWT(email) {
  const jwtToken = await createJWT({ email }, { expiresIn: new TimeSpan(30, "m") });
  return { jwtToken };
}
async function sendPasswordResetEmail(email, content) {
  return sendEmailAndSaveMetadata(email, content, {
    passwordResetSentAt: (/* @__PURE__ */ new Date()).toISOString()
  });
}
async function sendEmailVerificationEmail(email, content) {
  return sendEmailAndSaveMetadata(email, content, {
    emailVerificationSentAt: (/* @__PURE__ */ new Date()).toISOString()
  });
}
async function sendEmailAndSaveMetadata(email, content, metadata) {
  const providerId = createProviderId("email", email);
  const authIdentity = await findAuthIdentity(providerId);
  if (!authIdentity) {
    throw new Error(`User with email: ${email} not found.`);
  }
  const providerData = getProviderDataWithPassword(authIdentity.providerData);
  await updateAuthIdentityProviderData(providerId, providerData, metadata);
  emailSender.send(content).catch((e) => {
    console.error("Failed to send email", e);
  });
}
function isEmailResendAllowed(fields, field, resendInterval = 1e3 * 60) {
  const sentAt = fields[field];
  if (!sentAt) {
    return {
      isResendAllowed: true,
      timeLeft: 0
    };
  }
  const now = /* @__PURE__ */ new Date();
  const diff = now.getTime() - new Date(sentAt).getTime();
  const isResendAllowed = diff > resendInterval;
  const timeLeft = isResendAllowed ? 0 : Math.round((resendInterval - diff) / 1e3);
  return { isResendAllowed, timeLeft };
}

function getSignupRoute({
  userSignupFields,
  fromField,
  clientRoute,
  getVerificationEmailContent,
  isEmailAutoVerified
}) {
  return async function signup(req, res) {
    const fields = req.body;
    ensureValidArgs$1(fields);
    const providerId = createProviderId("email", fields.email);
    const existingAuthIdentity = await findAuthIdentity(providerId);
    if (existingAuthIdentity) {
      const providerData = getProviderDataWithPassword(
        existingAuthIdentity.providerData
      );
      if (providerData.isEmailVerified) {
        await doFakeWork();
        res.json({ success: true });
        return;
      }
      const { isResendAllowed, timeLeft } = isEmailResendAllowed(
        providerData,
        "passwordResetSentAt"
      );
      if (!isResendAllowed) {
        throw new HttpError(
          400,
          `Please wait ${timeLeft} secs before trying again.`
        );
      }
      try {
        await deleteUserByAuthId(existingAuthIdentity.authId);
      } catch (e) {
        rethrowPossibleAuthError(e);
      }
    }
    const userFields = await validateAndGetUserFields(fields, userSignupFields);
    const newUserProviderData = await sanitizeAndSerializeProviderData(
      {
        hashedPassword: fields.password,
        isEmailVerified: isEmailAutoVerified ? true : false,
        emailVerificationSentAt: null,
        passwordResetSentAt: null
      }
    );
    try {
      await onBeforeSignupHook({ req, providerId });
      const user = await createUser(
        providerId,
        newUserProviderData,
        // Using any here because we want to avoid TypeScript errors and
        // rely on Prisma to validate the data.
        userFields
      );
      await onAfterSignupHook({ req, providerId, user });
    } catch (e) {
      rethrowPossibleAuthError(e);
    }
    if (isEmailAutoVerified) {
      res.json({ success: true });
      return;
    }
    const verificationLink = await createEmailVerificationLink(
      fields.email,
      clientRoute
    );
    try {
      await sendEmailVerificationEmail(fields.email, {
        from: fromField,
        to: fields.email,
        ...getVerificationEmailContent({ verificationLink })
      });
    } catch (e) {
      console.error("Failed to send email verification email:", e);
      throw new HttpError(500, "Failed to send email verification email.");
    }
    res.json({ success: true });
  };
}
function ensureValidArgs$1(args) {
  ensureValidEmail(args);
  ensurePasswordIsPresent(args);
  ensureValidPassword(args);
}

function getRequestPasswordResetRoute({
  fromField,
  clientRoute,
  getPasswordResetEmailContent
}) {
  return async function requestPasswordReset(req, res) {
    const args = req.body ?? {};
    ensureValidEmail(args);
    const authIdentity = await findAuthIdentity(
      createProviderId("email", args.email)
    );
    if (!authIdentity) {
      await doFakeWork();
      res.json({ success: true });
      return;
    }
    const providerData = getProviderDataWithPassword(authIdentity.providerData);
    const { isResendAllowed, timeLeft } = isEmailResendAllowed(providerData, "passwordResetSentAt");
    if (!isResendAllowed) {
      throw new HttpError(400, `Please wait ${timeLeft} secs before trying again.`);
    }
    const passwordResetLink = await createPasswordResetLink(args.email, clientRoute);
    try {
      const email = authIdentity.providerUserId;
      await sendPasswordResetEmail(
        email,
        {
          from: fromField,
          to: email,
          ...getPasswordResetEmailContent({ passwordResetLink })
        }
      );
    } catch (e) {
      console.error("Failed to send password reset email:", e);
      throw new HttpError(500, "Failed to send password reset email.");
    }
    res.json({ success: true });
  };
}

async function resetPassword(req, res) {
  const args = req.body ?? {};
  ensureValidArgs(args);
  const { token, password } = args;
  const { email } = await validateJWT(token).catch(() => {
    throw new HttpError(400, "Password reset failed, invalid token");
  });
  const providerId = createProviderId("email", email);
  const authIdentity = await findAuthIdentity(providerId);
  if (!authIdentity) {
    throw new HttpError(400, "Password reset failed, invalid token");
  }
  const providerData = getProviderDataWithPassword(authIdentity.providerData);
  await updateAuthIdentityProviderData(providerId, providerData, {
    // The act of resetting the password verifies the email
    isEmailVerified: true,
    // The password will be hashed when saving the providerData
    // in the DB
    hashedPassword: password
  });
  res.json({ success: true });
}
function ensureValidArgs(args) {
  ensureTokenIsPresent(args);
  ensurePasswordIsPresent(args);
  ensureValidPassword(args);
}

async function verifyEmail(req, res) {
  const { token } = req.body;
  const { email } = await validateJWT(token).catch(() => {
    throw new HttpError(400, "Email verification failed, invalid token");
  });
  const providerId = createProviderId("email", email);
  const authIdentity = await findAuthIdentity(providerId);
  if (!authIdentity) {
    throw new HttpError(400, "Email verification failed, invalid token");
  }
  const providerData = getProviderDataWithPassword(authIdentity.providerData);
  await updateAuthIdentityProviderData(providerId, providerData, {
    isEmailVerified: true
  });
  const auth = await findAuthWithUserBy({ id: authIdentity.authId });
  await onAfterEmailVerifiedHook({ user: auth.user });
  res.json({ success: true });
}

function defineUserSignupFields(fields) {
  return fields;
}

const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
const emailDataSchema = z$1.object({
  email: z$1.string()
});
const getEmailUserFields = defineUserSignupFields({
  email: (data) => {
    const emailData = emailDataSchema.parse(data);
    return emailData.email;
  },
  username: (data) => {
    const emailData = emailDataSchema.parse(data);
    return emailData.email;
  },
  isAdmin: (data) => {
    const emailData = emailDataSchema.parse(data);
    return adminEmails.includes(emailData.email);
  }
});
z$1.object({
  profile: z$1.object({
    emails: z$1.array(
      z$1.object({
        email: z$1.string(),
        verified: z$1.boolean()
      })
    ).min(1, "You need to have an email address associated with your GitHub account to sign up."),
    login: z$1.string()
  })
});
z$1.object({
  profile: z$1.object({
    email: z$1.string(),
    email_verified: z$1.boolean()
  })
});
z$1.object({
  profile: z$1.object({
    username: z$1.string(),
    email: z$1.string().email().nullable(),
    verified: z$1.boolean().nullable()
  })
});

const getVerificationEmailContent = ({ verificationLink }) => ({
  subject: "Verify your email",
  text: `Click the link below to verify your email: ${verificationLink}`,
  html: `
        <p>Click the link below to verify your email</p>
        <a href="${verificationLink}">Verify email</a>
    `
});
const getPasswordResetEmailContent = ({ passwordResetLink }) => ({
  subject: "Password reset",
  text: `Click the link below to reset your password: ${passwordResetLink}`,
  html: `
        <p>Click the link below to reset your password</p>
        <a href="${passwordResetLink}">Reset password</a>
    `
});

const _waspUserSignupFields = getEmailUserFields;
const _waspGetVerificationEmailContent = getVerificationEmailContent;
const _waspGetPasswordResetEmailContent = getPasswordResetEmailContent;
const fromField = {
  name: "Postmarkr",
  email: "nathan@postmarkr.com"
};
const config = {
  id: "email",
  displayName: "Email and password",
  createRouter() {
    const router = Router();
    const loginRoute = defineHandler(getLoginRoute());
    router.post("/login", loginRoute);
    const signupRoute = defineHandler(getSignupRoute({
      userSignupFields: _waspUserSignupFields,
      fromField,
      clientRoute: "/email-verification",
      getVerificationEmailContent: _waspGetVerificationEmailContent,
      isEmailAutoVerified: env.SKIP_EMAIL_VERIFICATION_IN_DEV
    }));
    router.post("/signup", signupRoute);
    const requestPasswordResetRoute = defineHandler(getRequestPasswordResetRoute({
      fromField,
      clientRoute: "/password-reset",
      getPasswordResetEmailContent: _waspGetPasswordResetEmailContent
    }));
    router.post("/request-password-reset", requestPasswordResetRoute);
    router.post("/reset-password", defineHandler(resetPassword));
    router.post("/verify-email", defineHandler(verifyEmail));
    return router;
  }
};

const providers = [
  config
];
const router$3 = Router();
for (const provider of providers) {
  const { createRouter } = provider;
  const providerRouter = createRouter(provider);
  router$3.use(`/${provider.id}`, providerRouter);
  console.log(`\u{1F680} "${provider.displayName}" auth initialized`);
}

const router$2 = express.Router();
router$2.get("/me", auth, me);
router$2.post("/logout", auth, logout);
router$2.use("/", router$3);

const paymentsWebhook = paymentProcessor.webhook;
const paymentsMiddlewareConfigFn = paymentProcessor.webhookMiddlewareConfigFn;

const lobWebhook = async (request, response, context) => {
  try {
    const payload = JSON.parse(request.body);
    const { id: lobId, status, tracking_number } = payload;
    if (!lobId) {
      throw new HttpError(400, "Missing required webhook data: lobId");
    }
    const statusMapping = {
      "delivered": "delivered",
      "returned": "returned",
      "returned_to_sender": "returned",
      "in_transit": "in_transit",
      "processing": "submitted",
      "printed": "submitted",
      "mailed": "submitted",
      "created": "submitted",
      "cancelled": "failed",
      "failed": "failed"
    };
    const internalStatus = statusMapping[status] || status || "unknown";
    await updateMailPieceStatus$2({
      lobId,
      lobStatus: internalStatus,
      lobTrackingNumber: tracking_number,
      lobData: payload
    }, context);
    console.log(`Updated mail piece ${lobId} to status: ${internalStatus}`);
    return response.status(200).json({ received: true });
  } catch (err) {
    console.error("Lob webhook error:", err);
    if (err instanceof HttpError) {
      return response.status(err.statusCode).json({ error: err.message });
    } else {
      return response.status(400).json({ error: "Error processing Lob webhook event" });
    }
  }
};
const lobMiddlewareConfigFn = (middlewareConfig) => {
  middlewareConfig.delete("express.json");
  middlewareConfig.set("express.raw", express.raw({ type: "application/json" }));
  return middlewareConfig;
};

async function validateAddressEndpoint(req, res, context) {
  try {
    const { address_line1, address_line2, city, state, zip_code, country } = req.body;
    if (!address_line1 || !city || !state || !zip_code || !country) {
      throw new HttpError(400, "Missing required address fields");
    }
    const result = await validateAddress({
      address_line1,
      address_line2,
      city,
      state,
      zip_code,
      country
    });
    res.json({
      isValid: result.isValid,
      error: result.error,
      lobAddressId: result.verifiedAddress?.id,
      verifiedAddress: result.verifiedAddress
    });
  } catch (error) {
    console.error("Address validation error:", error);
    if (error instanceof HttpError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

const idFn = (x) => x;
const _waspvalidateAddressmiddlewareConfigFn = idFn;
const router$1 = express.Router();
const paymentsWebhookMiddleware = globalMiddlewareConfigForExpress(paymentsMiddlewareConfigFn);
router$1.post(
  "/payments-webhook",
  [auth, ...paymentsWebhookMiddleware],
  defineHandler(
    (req, res) => {
      const context = {
        user: makeAuthUserIfPossible(req.user),
        entities: {
          User: dbClient.user
        }
      };
      return paymentsWebhook(req, res, context);
    }
  )
);
const lobWebhookMiddleware = globalMiddlewareConfigForExpress(lobMiddlewareConfigFn);
router$1.post(
  "/webhooks/lob",
  [auth, ...lobWebhookMiddleware],
  defineHandler(
    (req, res) => {
      const context = {
        user: makeAuthUserIfPossible(req.user),
        entities: {}
      };
      return lobWebhook(req, res, context);
    }
  )
);
const validateAddressMiddleware = globalMiddlewareConfigForExpress(_waspvalidateAddressmiddlewareConfigFn);
router$1.post(
  "/api/validate-address",
  [auth, ...validateAddressMiddleware],
  defineHandler(
    (req, res) => {
      ({
        user: makeAuthUserIfPossible(req.user)});
      return validateAddressEndpoint(req, res);
    }
  )
);

const router = express.Router();
const middleware = globalMiddlewareConfigForExpress();
router.get("/", middleware, function(_req, res) {
  res.status(200).send();
});
router.use("/auth", middleware, router$2);
router.use("/operations", middleware, router$4);
router.use(router$1);

const app = express();
app.use("/", router);
app.use((err, _req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({ message: err.message, data: err.data });
  }
  return next(err);
});

registerJob({
  job: processPDFMetadata$1,
  jobFn: processPDFMetadata
});

const CLIENT_EMAIL = process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL;
const PRIVATE_KEY = Buffer.from(process.env.GOOGLE_ANALYTICS_PRIVATE_KEY, "base64").toString("utf-8");
const PROPERTY_ID = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;
const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: {
    client_email: CLIENT_EMAIL,
    private_key: PRIVATE_KEY
  }
});
async function getSources() {
  const [response] = await analyticsDataClient.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [
      {
        startDate: "2020-01-01",
        endDate: "today"
      }
    ],
    // for a list of dimensions and metrics see https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema
    dimensions: [
      {
        name: "source"
      }
    ],
    metrics: [
      {
        name: "activeUsers"
      }
    ]
  });
  let activeUsersPerReferrer = [];
  if (response?.rows) {
    activeUsersPerReferrer = response.rows.map((row) => {
      if (row.dimensionValues && row.metricValues) {
        return {
          source: row.dimensionValues[0].value,
          visitors: row.metricValues[0].value
        };
      }
    });
  } else {
    throw new Error("No response from Google Analytics");
  }
  return activeUsersPerReferrer;
}
async function getDailyPageViews() {
  const totalViews = await getTotalPageViews();
  const prevDayViewsChangePercent = await getPrevDayViewsChangePercent();
  return {
    totalViews,
    prevDayViewsChangePercent
  };
}
async function getTotalPageViews() {
  const [response] = await analyticsDataClient.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [
      {
        startDate: "2020-01-01",
        // go back to earliest date of your app
        endDate: "today"
      }
    ],
    metrics: [
      {
        name: "screenPageViews"
      }
    ]
  });
  let totalViews = 0;
  if (response?.rows) {
    totalViews = parseInt(response.rows[0].metricValues[0].value);
  } else {
    throw new Error("No response from Google Analytics");
  }
  return totalViews;
}
async function getPrevDayViewsChangePercent() {
  const [response] = await analyticsDataClient.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [
      {
        startDate: "2daysAgo",
        endDate: "yesterday"
      }
    ],
    orderBys: [
      {
        dimension: {
          dimensionName: "date"
        },
        desc: true
      }
    ],
    dimensions: [
      {
        name: "date"
      }
    ],
    metrics: [
      {
        name: "screenPageViews"
      }
    ]
  });
  let viewsFromYesterday;
  let viewsFromDayBeforeYesterday;
  if (response?.rows && response.rows.length === 2) {
    viewsFromYesterday = response.rows[0].metricValues[0].value;
    viewsFromDayBeforeYesterday = response.rows[1].metricValues[0].value;
    if (viewsFromYesterday && viewsFromDayBeforeYesterday) {
      viewsFromYesterday = parseInt(viewsFromYesterday);
      viewsFromDayBeforeYesterday = parseInt(viewsFromDayBeforeYesterday);
      if (viewsFromYesterday === 0 || viewsFromDayBeforeYesterday === 0) {
        return "0";
      }
      console.table({ viewsFromYesterday, viewsFromDayBeforeYesterday });
      const change = (viewsFromYesterday - viewsFromDayBeforeYesterday) / viewsFromDayBeforeYesterday * 100;
      return change.toFixed(0);
    }
  } else {
    return "0";
  }
}

const calculateDailyStats = async (_args, context) => {
  const nowUTC = new Date(Date.now());
  nowUTC.setUTCHours(0, 0, 0, 0);
  const yesterdayUTC = new Date(nowUTC);
  yesterdayUTC.setUTCDate(yesterdayUTC.getUTCDate() - 1);
  try {
    const yesterdaysStats = await context.entities.DailyStats.findFirst({
      where: {
        date: {
          equals: yesterdayUTC
        }
      }
    });
    const userCount = await context.entities.User.count({});
    const paidUserCount = await context.entities.User.count({
      where: {
        subscriptionStatus: SubscriptionStatus.Active
      }
    });
    let userDelta = userCount;
    let paidUserDelta = paidUserCount;
    if (yesterdaysStats) {
      userDelta -= yesterdaysStats.userCount;
      paidUserDelta -= yesterdaysStats.paidUserCount;
    }
    let totalRevenue;
    switch (paymentProcessor.id) {
      case "stripe":
        totalRevenue = await fetchTotalStripeRevenue();
        break;
      case "lemonsqueezy":
        totalRevenue = await fetchTotalLemonSqueezyRevenue();
        break;
      default:
        throw new Error(`Unsupported payment processor: ${paymentProcessor.id}`);
    }
    const { totalViews, prevDayViewsChangePercent } = await getDailyPageViews();
    let dailyStats = await context.entities.DailyStats.findUnique({
      where: {
        date: nowUTC
      }
    });
    if (!dailyStats) {
      console.log("No daily stat found for today, creating one...");
      dailyStats = await context.entities.DailyStats.create({
        data: {
          date: nowUTC,
          totalViews,
          prevDayViewsChangePercent,
          userCount,
          paidUserCount,
          userDelta,
          paidUserDelta,
          totalRevenue
        }
      });
    } else {
      console.log("Daily stat found for today, updating it...");
      dailyStats = await context.entities.DailyStats.update({
        where: {
          id: dailyStats.id
        },
        data: {
          totalViews,
          prevDayViewsChangePercent,
          userCount,
          paidUserCount,
          userDelta,
          paidUserDelta,
          totalRevenue
        }
      });
    }
    const sources = await getSources();
    for (const source of sources) {
      let visitors = source.visitors;
      if (typeof source.visitors !== "number") {
        visitors = parseInt(source.visitors);
      }
      await context.entities.PageViewSource.upsert({
        where: {
          date_name: {
            date: nowUTC,
            name: source.source
          }
        },
        create: {
          date: nowUTC,
          name: source.source,
          visitors,
          dailyStatsId: dailyStats.id
        },
        update: {
          visitors
        }
      });
    }
    console.table({ dailyStats });
  } catch (error) {
    console.error("Error calculating daily stats: ", error);
    await context.entities.Logs.create({
      data: {
        message: `Error calculating daily stats: ${error?.message}`,
        level: "job-error"
      }
    });
  }
};
async function fetchTotalStripeRevenue() {
  let totalRevenue = 0;
  let params = {
    limit: 100,
    // created: {
    //   gte: startTimestamp,
    //   lt: endTimestamp
    // },
    type: "charge"
  };
  let hasMore = true;
  while (hasMore) {
    const balanceTransactions = await stripe.balanceTransactions.list(params);
    for (const transaction of balanceTransactions.data) {
      if (transaction.type === "charge") {
        totalRevenue += transaction.amount;
      }
    }
    if (balanceTransactions.has_more) {
      params.starting_after = balanceTransactions.data[balanceTransactions.data.length - 1].id;
    } else {
      hasMore = false;
    }
  }
  return totalRevenue / 100;
}
async function fetchTotalLemonSqueezyRevenue() {
  return 0;
}

registerJob({
  job: dailyStatsJob,
  jobFn: calculateDailyStats
});

const startServer = async () => {
  await startPgBoss();
  const port = normalizePort(config$1.port);
  app.set("port", port);
  const server = http.createServer(app);
  server.listen(port);
  server.on("error", (error) => {
    if (error.syscall !== "listen") throw error;
    const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;
    switch (error.code) {
      case "EACCES":
        console.error(bind + " requires elevated privileges");
        process.exit(1);
      case "EADDRINUSE":
        console.error(bind + " is already in use");
        process.exit(1);
      default:
        throw error;
    }
  });
  server.on("listening", () => {
    const addr = server.address();
    const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
    console.log("Server listening on " + bind);
  });
};
startServer().catch((e) => console.error(e));
function normalizePort(val) {
  const port = parseInt(val, 10);
  if (isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
}
//# sourceMappingURL=server.js.map
