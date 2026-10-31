import {sqliteTable,text,integer,uniqueIndex,index} from 'drizzle-orm/sqlite-core';
import {sql} from 'drizzle-orm';
export const User=sqliteTable('User',{
  id:text('id').primaryKey(),
  email:text('email').notNull().unique(),
  passwordHash:text('passwordHash').notNull(),
  createdAt:text('createdAt').notNull().default(sql`CURRENT_TIMESTAMP`)
});
export const Session=sqliteTable('Session',{
  id:text('id').primaryKey(),
  tokenHash:text('tokenHash').notNull().unique(),
  userId:text('userId').notNull().references(()=>User.id,{onDelete:'cascade'}),
  expiresAt:text('expiresAt').notNull()
},t=>[index('Session_userId_index').on(t.userId)]);
export const Business=sqliteTable('Business',{
  id:text('id').primaryKey(),
  ownerId:text('ownerId').notNull().unique().references(()=>User.id,{onDelete:'cascade'}),
  name:text('name').notNull(),
  type:text('type').notNull(),
  country:text('country').notNull().default("Uzbekistan"),
  createdAt:text('createdAt').notNull().default(sql`CURRENT_TIMESTAMP`)
});
export const Project=sqliteTable('Project',{
  id:text('id').primaryKey(),
  businessId:text('businessId').notNull().references(()=>Business.id,{onDelete:'cascade'}),
  name:text('name').notNull(),
  website:text('website'),
  description:text('description'),
  archivedAt:text('archivedAt'),
  createdAt:text('createdAt').notNull().default(sql`CURRENT_TIMESTAMP`)
});
export const Membership=sqliteTable('Membership',{
  userId:text('userId').notNull().references(()=>User.id,{onDelete:'cascade'}),
  projectId:text('projectId').notNull().references(()=>Project.id,{onDelete:'cascade'}),
  role:text('role').notNull().default("owner")
},t=>[uniqueIndex('Membership_userId_projectId_id').on(t.userId,t.projectId)]);
export const ApiKey=sqliteTable('ApiKey',{
  id:text('id').primaryKey(),
  projectId:text('projectId').notNull().references(()=>Project.id,{onDelete:'cascade'}),
  name:text('name').notNull(),
  prefix:text('prefix').notNull(),
  secretHash:text('secretHash').notNull().unique(),
  createdAt:text('createdAt').notNull().default(sql`CURRENT_TIMESTAMP`),
  revokedAt:text('revokedAt')
},t=>[index('ApiKey_projectId_index').on(t.projectId)]);
export const Transaction=sqliteTable('Transaction',{
  id:text('id').primaryKey(),
  projectId:text('projectId').notNull().references(()=>Project.id,{onDelete:'cascade'}),
  amountMinor:integer('amountMinor').notNull(),
  currency:text('currency').notNull().default("UZS"),
  status:text('status').notNull(),
  idempotencyKey:text('idempotencyKey').notNull(),
  requestHash:text('requestHash').notNull(),
  createdAt:text('createdAt').notNull().default(sql`CURRENT_TIMESTAMP`)
},t=>[uniqueIndex('Transaction_projectId_idempotencyKey_unique').on(t.projectId,t.idempotencyKey),index('Transaction_projectId_createdAt_index').on(t.projectId,t.createdAt),index('Transaction_projectId_status_index').on(t.projectId,t.status)]);
export const WebhookEndpoint=sqliteTable('WebhookEndpoint',{
  id:text('id').primaryKey(),
  projectId:text('projectId').notNull().references(()=>Project.id,{onDelete:'cascade'}),
  url:text('url').notNull(),
  events:text('events').notNull(),
  secretEncrypted:text('secretEncrypted').notNull(),
  createdAt:text('createdAt').notNull().default(sql`CURRENT_TIMESTAMP`),
  disabledAt:text('disabledAt')
},t=>[index('WebhookEndpoint_projectId_index').on(t.projectId)]);
export const WebhookDelivery=sqliteTable('WebhookDelivery',{
  id:text('id').primaryKey(),
  endpointId:text('endpointId').notNull().references(()=>WebhookEndpoint.id,{onDelete:'cascade'}),
  transactionId:text('transactionId').notNull().references(()=>Transaction.id,{onDelete:'cascade'}),
  event:text('event').notNull(),
  attempts:integer('attempts').notNull().default(0),
  status:text('status').notNull().default("queued"),
  responseCode:integer('responseCode'),
  error:text('error'),
  lastAttemptAt:text('lastAttemptAt'),
  createdAt:text('createdAt').notNull().default(sql`CURRENT_TIMESTAMP`)
},t=>[uniqueIndex('WebhookDelivery_endpointId_transactionId_unique').on(t.endpointId,t.transactionId)]);
export const AuditLog=sqliteTable('AuditLog',{
  id:text('id').primaryKey(),
  projectId:text('projectId').notNull().references(()=>Project.id,{onDelete:'cascade'}),
  action:text('action').notNull(),
  resourceId:text('resourceId').notNull(),
  createdAt:text('createdAt').notNull().default(sql`CURRENT_TIMESTAMP`)
},t=>[index('AuditLog_projectId_createdAt_index').on(t.projectId,t.createdAt)]);
export const RateLimit=sqliteTable('RateLimit',{
  key:text('key').primaryKey(),
  count:integer('count').notNull().default(1),
  resetsAt:text('resetsAt').notNull()
});
export const PaymentLink=sqliteTable('PaymentLink',{
  id:text('id').primaryKey(),
  projectId:text('projectId').notNull().references(()=>Project.id,{onDelete:'restrict'}),
  title:text('title').notNull(),
  amountMinor:integer('amountMinor').notNull(),
  currency:text('currency').notNull().default('UZS'),
  createdAt:text('createdAt').notNull().default(sql`CURRENT_TIMESTAMP`),
  disabledAt:text('disabledAt')
},t=>[index('PaymentLink_projectId_createdAt_idx').on(t.projectId,t.createdAt)]);
export const CheckoutSession=sqliteTable('CheckoutSession',{
  id:text('id').primaryKey(),
  projectId:text('projectId').notNull().references(()=>Project.id,{onDelete:'restrict'}),
  linkId:text('linkId').references(()=>PaymentLink.id,{onDelete:'restrict'}),
  title:text('title').notNull(),
  amountMinor:integer('amountMinor').notNull(),
  currency:text('currency').notNull().default('UZS'),
  requestKey:text('requestKey').notNull(),
  requestHash:text('requestHash').notNull(),
  result:text('result'),
  createdAt:text('createdAt').notNull().default(sql`CURRENT_TIMESTAMP`),
  expiresAt:text('expiresAt').notNull()
},t=>[uniqueIndex('CheckoutSession_projectId_requestKey_key').on(t.projectId,t.requestKey),index('CheckoutSession_projectId_createdAt_idx').on(t.projectId,t.createdAt)]);


export const TelegramConnection=sqliteTable('TelegramConnection',{
 id:text('id').primaryKey(), userId:text('userId').notNull().unique().references(()=>User.id,{onDelete:'cascade'}), chatId:text('chatId').notNull().unique(), linkedAt:text('linkedAt').notNull().default(sql`CURRENT_TIMESTAMP`)
});
export const TelegramLink=sqliteTable('TelegramLink',{
 userId:text('userId').primaryKey().references(()=>User.id,{onDelete:'cascade'}), codeHash:text('codeHash').notNull().unique(), expiresAt:text('expiresAt').notNull()
});
export const TelegramMessage=sqliteTable('TelegramMessage',{
 id:text('id').primaryKey(),connectionId:text('connectionId').notNull().references(()=>TelegramConnection.id,{onDelete:'cascade'}),externalId:text('externalId').notNull(),role:text('role').notNull(),content:text('content').notNull(),createdAt:text('createdAt').notNull().default(sql`CURRENT_TIMESTAMP`)
},t=>[uniqueIndex('TelegramMessage_connectionId_externalId_key').on(t.connectionId,t.externalId),index('TelegramMessage_connectionId_createdAt_idx').on(t.connectionId,t.createdAt)]);
export const SupportTicket=sqliteTable('SupportTicket',{
 id:text('id').primaryKey(),userId:text('userId').notNull().references(()=>User.id,{onDelete:'cascade'}),requestKey:text('requestKey').notNull().unique(),summary:text('summary').notNull(),diagnostics:text('diagnostics',{mode:'json'}).notNull(),status:text('status').notNull().default('queued'),attempts:integer('attempts').notNull().default(0),retryAt:text('retryAt').notNull().default(sql`CURRENT_TIMESTAMP`),deliveredAt:text('deliveredAt'),createdAt:text('createdAt').notNull().default(sql`CURRENT_TIMESTAMP`)
},t=>[index('SupportTicket_status_retryAt_idx').on(t.status,t.retryAt),index('SupportTicket_userId_createdAt_idx').on(t.userId,t.createdAt)]);
export const SupportBotState=sqliteTable('SupportBotState',{
 id:text('id').primaryKey(),offset:integer('offset').notNull().default(0),leaseOwner:text('leaseOwner'),leaseUntil:text('leaseUntil')
});
