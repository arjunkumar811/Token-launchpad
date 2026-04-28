"use client";

import { AtSign, Globe, MessageCircleMore, Send } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SocialLinks as SocialLinksType } from "@/types/token";

type SocialLinksProps = {
  enabled: boolean;
  errors: Partial<Record<keyof SocialLinksType, string>>;
  onEnabledChange: (enabled: boolean) => void;
  onValueChange: (value: SocialLinksType) => void;
  value: SocialLinksType;
};

const SOCIAL_FIELDS: Array<{
  key: keyof SocialLinksType;
  label: string;
  placeholder: string;
  icon: typeof Globe;
}> = [
  { key: "website", label: "Website", placeholder: "https://yourproject.xyz", icon: Globe },
  { key: "twitter", label: "Twitter", placeholder: "https://x.com/yourtoken", icon: AtSign },
  { key: "telegram", label: "Telegram", placeholder: "https://t.me/yourtoken", icon: Send },
  { key: "discord", label: "Discord", placeholder: "https://discord.gg/yourtoken", icon: MessageCircleMore },
];

export function SocialLinks({
  enabled,
  errors,
  onEnabledChange,
  onValueChange,
  value,
}: SocialLinksProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Switch checked={enabled} onCheckedChange={onEnabledChange} />
      </div>

      {enabled ? (
        <div className="grid gap-4 lg:grid-cols-4">
          {SOCIAL_FIELDS.map((field) => {
            const Icon = field.icon;

            return (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                <div className="relative">
                  <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <Input
                    id={field.key}
                    className="pl-10"
                    placeholder={field.placeholder}
                    value={value[field.key] ?? ""}
                    onChange={(event) =>
                      onValueChange({
                        ...value,
                        [field.key]: event.target.value,
                      })
                    }
                  />
                </div>
                {errors[field.key] ? (
                  <p className="text-sm text-red-400">{errors[field.key]}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-sm text-zinc-400">Enable this to add website, Twitter, Telegram, or Discord links.</div>
      )}
    </div>
  );
}
