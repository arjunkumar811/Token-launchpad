"use client";

import { useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AlertCircle, BadgeCheck, ExternalLink, Info, Loader2, Rocket } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { AuthoritySettings } from "@/components/AuthoritySettings";
import { ImageUploader } from "@/components/ImageUploader";
import { SocialLinks } from "@/components/SocialLinks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createToken } from "@/lib/solana/createToken";
import { uploadTokenImage, uploadTokenMetadata } from "@/lib/uploadMetadata";
import { cn, getExplorerLink } from "@/lib/utils";
import {
  AuthoritySettings as AuthoritySettingsType,
  CreateTokenStep,
  DEFAULT_AUTHORITY_SETTINGS,
  DEFAULT_SOCIAL_LINKS,
  ExplorerResult,
  StepState,
  TokenCreationResult,
  TokenFormValues,
} from "@/types/token";

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg"];
const MAX_FILE_SIZE = 2 * 1024 * 1024;

const tokenFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  symbol: z
    .string()
    .trim()
    .min(1, "Symbol is required")
    .max(10, "Symbol must be 10 characters or fewer"),
  decimals: z.coerce
    .number()
    .int("Decimals must be a whole number")
    .min(0, "Decimals must be between 0 and 9")
    .max(9, "Decimals must be between 0 and 9"),
  supply: z
    .string()
    .trim()
    .min(1, "Supply is required")
    .refine((value) => /^\d+(\.\d+)?$/.test(value), "Supply must be a valid number")
    .refine((value) => Number(value) > 0, "Supply must be greater than 0"),
  description: z.string().trim().optional(),
  imageFile: z
    .custom<File | null>(
      (value) => typeof File !== "undefined" && value instanceof File,
      "Token image is required",
    )
    .refine(
      (file) => (file ? ACCEPTED_IMAGE_TYPES.includes(file.type) : false),
      "Only PNG and JPG files are accepted",
    )
    .refine((file) => (file ? file.size <= MAX_FILE_SIZE : false), "Image must be 2MB or smaller"),
  socialLinksEnabled: z.boolean(),
  socialLinks: z.object({
    website: z.string().trim().optional(),
    twitter: z.string().trim().optional(),
    telegram: z.string().trim().optional(),
    discord: z.string().trim().optional(),
  }),
  authoritySettings: z.object({
    revokeMintAuthority: z.boolean(),
    revokeFreezeAuthority: z.boolean(),
    revokeUpdateAuthority: z.boolean(),
  }),
});

const FORM_STEPS: CreateTokenStep[] = [
  "Uploading Image",
  "Uploading Metadata",
  "Creating Mint",
  "Minting Tokens",
  "Finalizing Metadata",
];

const DEV_FALLBACK_METADATA_URI = "https://example.com/devnet-token-metadata.json";

type FormSchemaValues = z.infer<typeof tokenFormSchema>;
type FormSchemaInput = z.input<typeof tokenFormSchema>;
type FormSchemaOutput = z.output<typeof tokenFormSchema>;

const DEFAULT_VALUES: TokenFormValues = {
  name: "",
  symbol: "",
  decimals: 6,
  supply: "1",
  description: "",
  imageFile: null,
  socialLinksEnabled: false,
  socialLinks: DEFAULT_SOCIAL_LINKS,
  authoritySettings: DEFAULT_AUTHORITY_SETTINGS,
};

export function TokenForm({ pinataConfigured }: { pinataConfigured: boolean }) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<CreateTokenStep | null>(null);
  const [result, setResult] = useState<TokenCreationResult | null>(null);

  const form = useForm<FormSchemaInput, unknown, FormSchemaOutput>({
    resolver: zodResolver(tokenFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setValue,
    watch,
  } = form;

  const values = watch();
  const socialLinkErrors = errors.socialLinks ?? {};

  const steps = useMemo(
    () =>
      FORM_STEPS.map<ExplorerResult>((step) => ({
        label: step,
        state: getStepState(step, activeStep, result, errorMessage),
      })),
    [activeStep, errorMessage, result],
  );

  const setAuthoritySettings = (next: AuthoritySettingsType) =>
    setValue("authoritySettings", next, { shouldDirty: true, shouldValidate: true });

  async function onSubmit(data: FormSchemaValues) {
    if (!wallet.publicKey || !wallet.sendTransaction) {
      setErrorMessage("Connect a supported Solana wallet before creating a token.");
      return;
    }

    try {
      setErrorMessage(null);
      setResult(null);

      let metadataUri = DEV_FALLBACK_METADATA_URI;

      if (pinataConfigured) {
        setActiveStep("Uploading Image");
        setStatusMessage("Uploading image to IPFS...");
        const imageUpload = await uploadTokenImage(data.imageFile as File);

        setActiveStep("Uploading Metadata");
        setStatusMessage("Generating metadata and uploading JSON to IPFS...");
        const metadataUpload = await uploadTokenMetadata({
          name: data.name,
          symbol: data.symbol,
          description: data.description ?? "",
          imageUri: imageUpload.gatewayUrl,
          imageMimeType: data.imageFile?.type ?? "image/png",
          socialLinks: data.socialLinksEnabled
            ? {
                website: data.socialLinks.website ?? "",
                twitter: data.socialLinks.twitter ?? "",
                telegram: data.socialLinks.telegram ?? "",
                discord: data.socialLinks.discord ?? "",
              }
            : DEFAULT_SOCIAL_LINKS,
        });

        metadataUri = metadataUpload.gatewayUrl;
      } else {
        setActiveStep("Uploading Metadata");
        setStatusMessage("PINATA_JWT not configured. Using fallback dev metadata to continue token creation...");
      }

      const tokenResult = await createToken({
        authoritySettings: data.authoritySettings,
        connection,
        decimals: data.decimals,
        metadataUri,
        name: data.name,
        sendTransaction: wallet.sendTransaction,
        supply: data.supply,
        symbol: data.symbol,
        walletPublicKey: wallet.publicKey,
        onStepChange: (step) => {
          setActiveStep(step);
          setStatusMessage(`${step}...`);
        },
      });

      setResult({
        ...tokenResult,
        name: data.name,
        symbol: data.symbol,
        explorerUrl: getExplorerLink(tokenResult.mintAddress),
      });
      setStatusMessage(
        pinataConfigured
          ? "Token created successfully."
          : "Token created successfully using fallback dev metadata.",
      );
      setActiveStep("Finalizing Metadata");
      form.reset(DEFAULT_VALUES);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Token creation failed.";
      setErrorMessage(message);
      setStatusMessage(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <Card className="bg-zinc-900">
        <CardContent className="p-6 sm:p-8">
          <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-6 md:grid-cols-2">
              <FieldBlock
                id="name"
                label="Name"
                required
                error={errors.name?.message}
              >
                <Input id="name" placeholder="Put the name of your Token" {...register("name")} />
              </FieldBlock>

              <FieldBlock
                id="symbol"
                label="Symbol"
                required
                error={errors.symbol?.message}
              >
                <Input id="symbol" placeholder="Put the symbol of your Token" {...register("symbol")} />
              </FieldBlock>

              <FieldBlock
                id="decimals"
                label="Decimals"
                required
                error={errors.decimals?.message}
              >
                <Input id="decimals" type="number" min={0} max={9} {...register("decimals")} />
              </FieldBlock>

              <FieldBlock
                id="supply"
                label="Supply"
                required
                error={errors.supply?.message}
              >
                <Input id="supply" type="number" min="0" step="any" {...register("supply")} />
              </FieldBlock>

              <div className="space-y-2">
                <Label htmlFor="token-image">
                  <span className="text-red-400">*</span> Image:
                </Label>
                <ImageUploader
                  value={values.imageFile}
                  error={errors.imageFile?.message}
                  onChange={(file) =>
                    setValue("imageFile", file, { shouldDirty: true, shouldValidate: true })
                  }
                />
                <p className="text-sm text-zinc-400">Most meme coin use a squared 1000x1000 logo</p>
              </div>

              <FieldBlock
                id="description"
                label="Description"
                required
                error={undefined}
              >
                <Textarea
                  id="description"
                  placeholder="Put the description of your Token"
                  rows={6}
                  {...register("description")}
                />
              </FieldBlock>
            </div>

            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <p className="text-2xl font-semibold text-zinc-100">Add Social Links</p>
                <Info className="h-4 w-4 text-zinc-400" />
              </div>

              <SocialLinks
                enabled={values.socialLinksEnabled}
                value={{
                  website: values.socialLinks.website ?? "",
                  twitter: values.socialLinks.twitter ?? "",
                  telegram: values.socialLinks.telegram ?? "",
                  discord: values.socialLinks.discord ?? "",
                }}
                errors={{
                  website: socialLinkErrors.website?.message,
                  twitter: socialLinkErrors.twitter?.message,
                  telegram: socialLinkErrors.telegram?.message,
                  discord: socialLinkErrors.discord?.message,
                }}
                onEnabledChange={(enabled) =>
                  setValue("socialLinksEnabled", enabled, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                onValueChange={(nextValue) =>
                  setValue("socialLinks", nextValue, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
            </div>

            <AuthoritySettings value={values.authoritySettings} onChange={setAuthoritySettings} />

            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-zinc-100">Transaction Status</h2>
              <div className="grid gap-3">
                {steps.map((step) => (
                  <div
                    key={step.label}
                    className="flex items-center justify-between rounded-2xl border border-zinc-600 bg-zinc-800/80 px-4 py-4"
                  >
                    <span className="text-base text-zinc-200">{step.label}</span>
                    <StatusBadge state={step.state} />
                  </div>
                ))}
              </div>

              {statusMessage ? (
                <div className="flex items-center gap-3 rounded-2xl border border-cyan-700/60 bg-cyan-950/30 px-4 py-3 text-sm text-cyan-200">
                  <Loader2 className={cn("h-4 w-4", isSubmitting && "animate-spin")} />
                  {statusMessage}
                </div>
              ) : null}

              {errorMessage ? (
                <div className="flex items-start gap-3 rounded-2xl border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              ) : null}
            </div>

            <div className="flex justify-center sm:justify-start">
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="min-w-[220px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Token...
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-4 w-4" />
                    Create Token
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {result ? (
        <Card className="bg-zinc-900">
          <CardContent className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
            <div className="sm:col-span-2 flex items-center gap-2 text-cyan-100">
              <BadgeCheck className="h-5 w-5 text-cyan-400" />
              <span className="text-xl font-semibold">Token Created Successfully</span>
            </div>
            <ResultRow label="Token Name" value={result.name} />
            <ResultRow label="Symbol" value={result.symbol} />
            <ResultRow label="Mint Address" value={result.mintAddress} mono />
            <ResultRow label="Transaction Signature" value={result.signature} mono />
            <a
              href={result.explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-zinc-600 bg-zinc-800 px-4 py-3 text-sm text-zinc-100"
            >
              View on Solana Explorer
              <ExternalLink className="h-4 w-4" />
            </a>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function getStepState(
  step: CreateTokenStep,
  activeStep: CreateTokenStep | null,
  result: TokenCreationResult | null,
  errorMessage: string | null,
): StepState {
  const currentIndex = activeStep ? FORM_STEPS.indexOf(activeStep) : -1;
  const stepIndex = FORM_STEPS.indexOf(step);

  if (result) {
    return "complete";
  }

  if (errorMessage && currentIndex !== -1) {
    return stepIndex === currentIndex ? "error" : stepIndex < currentIndex ? "complete" : "idle";
  }

  if (stepIndex < currentIndex) {
    return "complete";
  }

  if (step === activeStep) {
    return "active";
  }

  return "idle";
}

function FieldBlock({
  children,
  error,
  id,
  label,
  required = false,
}: {
  children: React.ReactNode;
  error?: string;
  id: string;
  label: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {required ? <span className="text-red-400">*</span> : null} {label}:
      </Label>
      {children}
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  );
}

function StatusBadge({ state }: { state: StepState }) {
  if (state === "complete") {
    return <span className="rounded-full bg-emerald-900/50 px-3 py-1 text-sm text-emerald-300">Done</span>;
  }

  if (state === "active") {
    return <span className="rounded-full bg-cyan-900/50 px-3 py-1 text-sm text-cyan-300">In progress</span>;
  }

  if (state === "error") {
    return <span className="rounded-full bg-red-900/50 px-3 py-1 text-sm text-red-300">Failed</span>;
  }

  return <span className="rounded-full bg-zinc-700 px-3 py-1 text-sm text-zinc-300">Pending</span>;
}

function ResultRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-zinc-700 bg-zinc-800 p-4">
      <p className="mb-1 text-sm text-zinc-400">{label}</p>
      <p className={cn("text-sm text-zinc-100", mono && "break-all font-mono text-xs")}>{value}</p>
    </div>
  );
}
