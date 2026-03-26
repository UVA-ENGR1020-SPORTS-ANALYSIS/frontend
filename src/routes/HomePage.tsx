import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { ArrowLeft, Users } from "lucide-react";

/* ─── types ──────────────────────────────────────────────────── */

type Step = "team-select" | "session-code" | "member-names";
type TeamCount = 1 | 2 | 4;

const nameSchema = z.object({
  members: z
    .array(
      z.object({
        name: z
          .string()
          .min(1, "Name is required")
          .max(20, "20 chars max"),
      }),
    )
    .min(1),
});

type NameForm = z.infer<typeof nameSchema>;

/* ─── component ──────────────────────────────────────────────── */

export function HomePage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("team-select");
  const [teamCount, setTeamCount] = useState<TeamCount>(1);
  const [sessionCode, setSessionCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [memberCount, setMemberCount] = useState(1);

  /* ─ name form (step 3) ─ */
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<NameForm>({
    resolver: zodResolver(nameSchema),
    defaultValues: { members: [{ name: "" }] },
  });

  const { fields, replace } = useFieldArray({ control, name: "members" });

  /* ─ helpers ─ */

  const handleTeamSelect = (count: TeamCount) => {
    setTeamCount(count);
    if (count === 1) {
      // Single team doesn't need a session code
      setMemberCount(1);
      replace([{ name: "" }]);
      setStep("member-names");
    } else {
      setStep("session-code");
    }
  };

  const handleCodeSubmit = async () => {
    if (sessionCode.length < 6) {
      setCodeError("Please enter all 6 digits");
      return;
    }
    setCodeError("");
    setIsValidating(true);

    try {
      // Validate session exists via backend
      const res = await fetch(`/api/connect/${sessionCode}`);
      if (!res.ok) {
        setCodeError("Session not found. Check your code.");
        return;
      }
      // Advance to member-names step
      setMemberCount(1);
      replace([{ name: "" }]);
      setStep("member-names");
    } catch {
      setCodeError("Could not reach server. Try again.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleMemberCountChange = (count: number) => {
    setMemberCount(count);
    const newMembers = Array.from({ length: count }, (_, i) =>
      i < fields.length ? fields[i] : { name: "" },
    );
    replace(newMembers);
  };

  const onNamesSubmit = async (data: NameForm) => {
    try {
      // Placeholder: in a real app, POST names to backend here
      console.log("Joining session", {
        sessionCode,
        teamCount,
        members: data.members.map((m) => m.name),
      });
      const code = sessionCode || "solo";
      navigate(`/session/${code}/lobby`);
    } catch (err) {
      console.error("Failed to join:", err);
    }
  };

  const goBack = () => {
    if (step === "session-code") {
      setSessionCode("");
      setCodeError("");
      setStep("team-select");
    } else if (step === "member-names") {
      if (teamCount === 1) {
        setStep("team-select");
      } else {
        setStep("session-code");
      }
    }
  };

  /* ─── render ───────────────────────────────────────────────── */

  return (
    <div className="flex h-screen flex-col items-center justify-center px-4">
      <h1 className="mb-6 text-4xl font-bold">TABLETOP</h1>

      {/* ── Step 1: Team Select ──────────────────────────────── */}
      {step === "team-select" && (
        <Card className="w-full max-w-xs py-4">
          <CardContent className="flex flex-col gap-3">
            <p className="text-center text-sm text-muted-foreground">
              How many teams are playing?
            </p>
            {([1, 2, 4] as TeamCount[]).map((count) => (
              <Button
                key={count}
                variant="outline"
                size="lg"
                className="w-full gap-2"
                onClick={() => handleTeamSelect(count)}
              >
                <Users className="size-4" />
                {count}-Team Game
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Step 2: Session Code ─────────────────────────────── */}
      {step === "session-code" && (
        <Card className="w-full max-w-xs py-4">
          <CardContent className="flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={goBack}
              className="flex w-full items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-4" />
              Back
            </button>

            <p className="text-center text-sm text-muted-foreground">
              Enter your 6-digit session code
            </p>

            <InputOTP
              maxLength={6}
              value={sessionCode}
              onChange={(val) => {
                setSessionCode(val);
                if (codeError) setCodeError("");
              }}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="size-12 text-lg" />
                <InputOTPSlot index={1} className="size-12 text-lg" />
                <InputOTPSlot index={2} className="size-12 text-lg" />
                <InputOTPSlot index={3} className="size-12 text-lg" />
                <InputOTPSlot index={4} className="size-12 text-lg" />
                <InputOTPSlot index={5} className="size-12 text-lg" />
              </InputOTPGroup>
            </InputOTP>

            {codeError && (
              <p className="text-sm text-destructive">{codeError}</p>
            )}

            <Button
              className="w-full"
              onClick={handleCodeSubmit}
              disabled={isValidating || sessionCode.length < 6}
            >
              {isValidating ? "Checking..." : "Join Session"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Step 3: Member Names ─────────────────────────────── */}
      {step === "member-names" && (
        <Card className="w-full max-w-xs py-4">
          <CardContent>
            <form
              onSubmit={handleSubmit(onNamesSubmit)}
              className="flex flex-col gap-4"
            >
              <button
                type="button"
                onClick={goBack}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="size-4" />
                Back
              </button>

              <p className="text-center text-sm text-muted-foreground">
                How many members per team?
              </p>

              {/* member count selector */}
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4].map((n) => (
                  <Button
                    key={n}
                    type="button"
                    variant={memberCount === n ? "default" : "outline"}
                    size="sm"
                    className="w-10"
                    onClick={() => handleMemberCountChange(n)}
                  >
                    {n}
                  </Button>
                ))}
              </div>

              {/* dynamic name inputs */}
              <FieldGroup>
                {fields.map((field, idx) => (
                  <Field
                    key={field.id}
                    data-invalid={!!errors.members?.[idx]?.name}
                  >
                    <Input
                      placeholder={`Player ${idx + 1} name`}
                      className="text-center"
                      maxLength={20}
                      {...register(`members.${idx}.name`)}
                    />
                    <FieldError>
                      {errors.members?.[idx]?.name?.message}
                    </FieldError>
                  </Field>
                ))}
              </FieldGroup>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Joining..." : "Continue"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default HomePage;
