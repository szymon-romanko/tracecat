import { z } from "zod"

import { ActionType } from "@/types/schemas"
import { stringArray, stringToJSONSchema } from "@/types/validators"

const WebhookActionSchema = z.object({
  path: z.string(), // The webhook ID
  secret: z.string().optional(), // The webhook secret
  url: z.string().url(), // Whitelist of supported URL formats
  method: z.enum(["GET", "POST"]),
})

const HTTPRequestActionSchema = z.object({
  url: z.string(),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  headers: stringToJSONSchema.optional(),
  payload: stringToJSONSchema,
})

const SendEmailActionSchema = z.object({
  // recipients is a comma delimited list of email addresses. Pasrse it into an array
  recipients: z
    .array(z.string().email().min(1, { message: "Strings cannot be empty" }))
    .min(1, { message: "List cannot be empty" }),
  subject: z.string(),
  contents: z.string(),
})

const conditionCompareActionSubtypes = [
  "less_than",
  "less_than_or_equal_to",
  "greater_than",
  "greater_than_or_equal_to",
  "equal_to",
  "not_equal_to",
] as const

const ConditionCompareActionSchema = z.object({
  subtype: z.enum(conditionCompareActionSubtypes),
  lhs: z.string().min(1),
  rhs: z.string().min(1),
})
const conditionRegexActionSubtypes = ["regex_match", "regex_not_match"] as const
const ConditionRegexActionSchema = z.object({
  subtype: z.enum(conditionRegexActionSubtypes),
  pattern: z.string(),
  text: z.string(),
})
const conditionMembershipActionSubtypes = [
  "contains",
  "does_not_contain",
] as const
const ConditionMembershipActionSchema = z.object({
  subtype: z.enum(conditionMembershipActionSubtypes),
  item: z.string(),
  container: z.string(),
})

const LLMTranslateActionSchema = z.object({
  message: z.string(),
  from_language: z.string(),
  to_language: z.string(),
  response_schema: stringToJSONSchema.optional(),
})

const LLMExtractActionSchema = z.object({
  message: z.string(),
  groups: stringArray,
  response_schema: stringToJSONSchema.optional(),
})

const LLMLabelTaskActionSchema = z.object({
  message: z.string(),
  labels: stringArray,
  response_schema: stringToJSONSchema.optional(),
})

const LLMChoiceTaskActionSchema = z.object({
  message: z.string(),
  choices: stringArray,
  response_schema: stringToJSONSchema.optional(),
})

const LLMSummarizeTaskActionSchema = z.object({
  message: z.string(),
  response_schema: stringToJSONSchema.optional(),
})

const OpenCaseActionSchema = z.object({
  title: z.string(),
  payload: stringToJSONSchema,
  malice: z.enum(["malicious", "benign"]),
  status: z.enum(["open", "closed", "in_progress", "reported", "escalated"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  context: stringToJSONSchema.optional(),
  action: z.string().optional(),
  suppression: stringToJSONSchema.optional(),
})
export const baseActionSchema = z.object({
  title: z.string(),
  description: z.string(),
})
export type BaseActionForm = z.infer<typeof baseActionSchema>

export type ActionFieldType = "input" | "select" | "textarea" | "json" | "array"
export interface ActionFieldOption {
  type: ActionFieldType
  options?: readonly string[]
  placeholder?: string
  disabled?: boolean
  optional?: boolean
  copyable?: boolean
}

export interface ActionFieldSchema {
  [key: string]: ActionFieldOption
}

export type AllActionFieldSchemas = {
  [actionType in ActionType]?: ActionFieldSchema
}

export const actionSchemaMap = {
  http_request: HTTPRequestActionSchema,
  webhook: WebhookActionSchema,
  send_email: SendEmailActionSchema,
  "condition.compare": ConditionCompareActionSchema,
  "condition.regex": ConditionRegexActionSchema,
  "condition.membership": ConditionMembershipActionSchema,
  "llm.translate": LLMTranslateActionSchema,
  "llm.extract": LLMExtractActionSchema,
  "llm.label": LLMLabelTaskActionSchema,
  "llm.choice": LLMChoiceTaskActionSchema,
  "llm.summarize": LLMSummarizeTaskActionSchema,
  open_case: OpenCaseActionSchema,
}

export const getSubActionSchema = (actionType: ActionType) => {
  return {
    subActionSchema:
      actionSchemaMap[actionType as keyof typeof actionSchemaMap],
    fieldSchema: actionFieldSchemas[actionType] || {},
  }
}

const LLM_MESSAGE_PLACEHOLDER =
  "The input message for the AI to extract information. You may use templated expressions here."

const LLM_RESPONSE_SCHEMA_PLACEHOLDER = `An optional JSON object to control the format of the LLM output. This is mapping of field name to data type (Python data types). You may also add comments. If left blank, the LLM will output freeform text.
For example:
{
\t"website_name": "str",
\t"created_year": "int",
\t"url": "str # This must be a valid url!"
}`

const actionFieldSchemas: Partial<AllActionFieldSchemas> = {
  webhook: {
    method: {
      type: "select",
      options: ["GET", "POST"],
    },
    path: { type: "input", disabled: true },
    secret: { type: "input", disabled: true },
    url: { type: "input", disabled: true, copyable: true },
  },
  http_request: {
    url: { type: "input" },
    method: {
      type: "select",
      options: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    },
    headers: { type: "json" },
    payload: { type: "json" },
  },
  send_email: {
    recipients: { type: "array" },
    subject: { type: "input" },
    contents: { type: "textarea" },
  },
  "condition.compare": {
    subtype: {
      type: "select",
      options: conditionCompareActionSubtypes,
    },
    lhs: { type: "input" },
    rhs: { type: "input" },
  },
  "condition.regex": {
    subtype: {
      type: "select",
      options: conditionRegexActionSubtypes,
    },
    pattern: { type: "input" },
    text: { type: "textarea" },
  },
  "condition.membership": {
    subtype: {
      type: "select",
      options: conditionMembershipActionSubtypes,
    },
    item: { type: "input" },
    container: { type: "input" },
  },
  "llm.translate": {
    // TODO: Replace with supported languages and Command input
    message: {
      type: "textarea",
      placeholder: LLM_MESSAGE_PLACEHOLDER,
    },
    from_language: { type: "input" },
    to_language: { type: "input" },
    response_schema: {
      type: "json",
      placeholder: LLM_RESPONSE_SCHEMA_PLACEHOLDER,
      optional: true,
    },
  },
  "llm.extract": {
    message: {
      type: "textarea",
      placeholder: LLM_MESSAGE_PLACEHOLDER,
    },
    // TODO: Replace with Command input and ability to add to list
    groups: { type: "array" }, // Assuming a comma-separated string to be transformed into an array
    response_schema: {
      type: "json",
      placeholder: LLM_RESPONSE_SCHEMA_PLACEHOLDER,
      optional: true,
    },
  },
  "llm.label": {
    // TODO: Replace with Command input and ability to add to list
    message: {
      type: "textarea",
      placeholder: LLM_MESSAGE_PLACEHOLDER,
    },
    labels: { type: "array" }, // Assuming a comma-separated string to be transformed into an array
    response_schema: {
      type: "json",
      placeholder: LLM_RESPONSE_SCHEMA_PLACEHOLDER,
      optional: true,
    },
  },
  "llm.choice": {
    message: {
      type: "textarea",
      placeholder: LLM_MESSAGE_PLACEHOLDER,
    },
    choices: { type: "array" },
    response_schema: {
      type: "json",
      placeholder: LLM_RESPONSE_SCHEMA_PLACEHOLDER,
      optional: true,
    },
  },
  "llm.summarize": {
    message: {
      type: "textarea",
      placeholder: LLM_MESSAGE_PLACEHOLDER,
    },
    response_schema: {
      type: "json",
      placeholder: LLM_RESPONSE_SCHEMA_PLACEHOLDER,
      optional: true,
    },
  },
  open_case: {
    title: { type: "input" },
    payload: {
      type: "json",
      placeholder:
        "A JSON payload to be included in the case. You may use templated expressions here.",
    },
    malice: {
      type: "select",
      options: ["malicious", "benign"],
    },
    status: {
      type: "select",
      options: ["open", "closed", "in_progress", "reported", "escalated"],
    },
    priority: {
      type: "select",
      options: ["low", "medium", "high", "critical"],
      optional: true,
    },
    context: {
      type: "json",
      optional: true,
      placeholder: "An optional JSON object containing additional context.",
    },
    action: {
      type: "textarea",
      optional: true,
      placeholder: "Action to be taken.",
    },
    suppression: {
      type: "json",
      optional: true,
      placeholder: "An optional JSON object containing suppression rules.",
    },
  },
}
