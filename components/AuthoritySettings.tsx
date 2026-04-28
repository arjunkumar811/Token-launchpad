"use client";

import { ShieldCheck } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AuthoritySettings as AuthoritySettingsType } from "@/types/token";

type AuthoritySettingsProps = {
  value: AuthoritySettingsType;
  onChange: (value: AuthoritySettingsType) => void;
};

const OPTIONS: Array<{
  key: keyof AuthoritySettingsType;
  label: string;
  hint: string;
}> = [
  {
    key: "revokeMintAuthority",
    label: "Revoke Mint Authority",
    hint: "Prevents any additional tokens from ever being minted.",
  },
  {
    key: "revokeFreezeAuthority",
    label: "Revoke Freeze Authority",
    hint: "Removes the ability to freeze token accounts later.",
  },
  {
    key: "revokeUpdateAuthority",
    label: "Revoke Update Authority",
    hint: "Locks metadata updates after the token is created.",
  },
];

export function AuthoritySettings({ value, onChange }: AuthoritySettingsProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-zinc-100">
          <ShieldCheck className="h-5 w-5 text-cyan-400" />
          <h3 className="text-2xl font-semibold">Revoke Authorities</h3>
        </div>
        <p className="text-base text-zinc-300">
          Solana Token have 3 authorities: Freeze Authority, Mint Authority and Update Authority. Revoke them to attract more investors.
        </p>
      </div>

      <div className="space-y-4">
        {OPTIONS.map((option) => (
          <div
            key={option.key}
            className="flex items-start justify-between gap-4 rounded-2xl border border-zinc-600 bg-zinc-800 p-4"
          >
            <div className="space-y-1">
              <Label htmlFor={option.key} className="text-sm font-medium text-zinc-100">
                {option.label}
              </Label>
              <p className="text-sm text-zinc-400">{option.hint}</p>
            </div>
            <Checkbox
              id={option.key}
              checked={value[option.key]}
              onCheckedChange={(checked) =>
                onChange({
                  ...value,
                  [option.key]: checked === true,
                })
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
