import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import { ArrowLeft } from "lucide-react";
import { joinTeam, getSessionDetails } from "@/api/sessions";

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

export function JoinMembersPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionCode = searchParams.get("code") ?? "";

  const [memberCount, setMemberCount] = useState(1);
  const [submitError, setSubmitError] = useState("");

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

  const handleMemberCountChange = (count: number) => {
    setMemberCount(count);
    const newMembers = Array.from({ length: count }, (_, i) =>
      i < fields.length ? fields[i] : { name: "" },
    );
    replace(newMembers);
  };

  const onSubmit = async (data: NameForm) => {
    setSubmitError("");
    try {
      const parsedCode = sessionCode ? parseInt(sessionCode, 10) : 0;
      await joinTeam({
        session_code: parsedCode,
        player_names: data.members.map((m) => m.name),
      });

      const details = await getSessionDetails(sessionCode);
      if (details.session.target_team === 1) {
        navigate(`/session/${sessionCode}/game`);
      } else {
        navigate(`/session/${sessionCode}/lobby`);
      }
    } catch (err: any) {
      console.error("Failed to join team:", err);
      setSubmitError(err.message || "Failed to connect to the server.");
    }
  };

  const goBack = () => {
    navigate(-1);
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center px-4">
      <h1 className="mb-6 text-4xl font-bold">TABLETOP</h1>

      <Card className="w-full max-w-xs py-4">
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
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
              How many players on your team?
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

            {submitError && (
              <p className="text-center text-sm font-medium text-destructive">
                {submitError}
              </p>
            )}

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
    </div>
  );
}

export default JoinMembersPage;
