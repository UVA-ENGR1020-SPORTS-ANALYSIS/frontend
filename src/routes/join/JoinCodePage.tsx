import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { ArrowLeft } from "lucide-react";
import { validateSessionCode } from "@/api/sessions";

export function JoinCodePage() {
  const navigate = useNavigate();

  const [sessionCode, setSessionCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  const handleCodeSubmit = async () => {
    if (sessionCode.length < 6) {
      setCodeError("Please enter all 6 digits");
      return;
    }
    setCodeError("");
    setIsValidating(true);

    try {
      await validateSessionCode(sessionCode);
      navigate(`/join/members?code=${sessionCode}`);
    } catch {
      setCodeError("Session not found or could not reach server. Check your code.");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center px-4">
      <h1 className="mb-6 text-4xl font-bold">TABLETOP</h1>

      <Card className="w-full max-w-xs py-4">
        <CardContent className="flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/")}
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
    </div>
  );
}

export default JoinCodePage;
