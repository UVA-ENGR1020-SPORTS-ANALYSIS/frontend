import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import { Card, CardContent } from "@/components/ui/card";

const joinSchema = z.object({
  sessionCode: z
    .string()
    .length(6, "Session code must be exactly 6 digits")
    .regex(/^\d{6}$/, "Only digits allowed (no letters or special characters)"),
  playerName: z
    .string()
    .min(1, "Please enter your name")
    .max(20, "Name must be 20 characters or less"),
});

type JoinForm = z.infer<typeof joinSchema>;

export function HomePage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<JoinForm>({
    resolver: zodResolver(joinSchema),
    defaultValues: { sessionCode: "", playerName: "" },
  });

  const onSubmit = async (data: JoinForm) => {
    try {
      const res = await fetch(
        `/api/connect?session_code=${data.sessionCode}&player_name=${encodeURIComponent(data.playerName)}`,
        { method: "POST" },
      );
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
                <FieldError>{errors.sessionCode?.message}</FieldError>
              </Field>
              <Field data-invalid={!!errors.playerName}>
                <Input
                  placeholder="Your Name"
                  className="text-center"
                  maxLength={20}
                  {...register("playerName")}
                />
                <FieldError>{errors.playerName?.message}</FieldError>
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
