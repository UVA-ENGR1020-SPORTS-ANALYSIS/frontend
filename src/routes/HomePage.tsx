import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import { Card, CardContent } from "@/components/ui/card";

const sessionCodeSchema = z.object({
  sessionCode: z
    .string()
    .length(6, "Session code must be exactly 6 digits")
    .regex(/^\d{6}$/, "Session code must be 6 digits only (no letters or special characters)"),
});

type SessionCodeForm = z.infer<typeof sessionCodeSchema>;

export function HomePage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SessionCodeForm>({
    resolver: zodResolver(sessionCodeSchema),
    defaultValues: { sessionCode: "" },
  });

  const onSubmit = async (data: SessionCodeForm) => {
    try {
      const res = await fetch(`/api/connect/${data.sessionCode}`);
      const json = await res.json();
      console.log(json);

      if (res.ok) {
        navigate(`/session/${data.sessionCode}/lobby`);
      }
    } catch (err) {
      console.error("Failed to connect:", err);
    }
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <h1 className="mb-4 text-4xl font-bold">TABLETOP</h1>
      <Card className="w-full max-w-xs py-4">
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field data-invalid={!!errors.sessionCode}>
                <Input
                  placeholder="Session Code"
                  className="text-center"
                  inputMode="numeric"
                  maxLength={6}
                  {...register("sessionCode")}
                />
                <FieldError>
                  {errors.sessionCode?.message}
                </FieldError>
              </Field>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Joining..." : "Join Game"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default HomePage;
