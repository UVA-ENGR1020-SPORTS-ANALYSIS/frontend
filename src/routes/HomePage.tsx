import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import { Card, CardContent } from "@/components/ui/card";

export function HomePage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <h1 className="mb-4 text-4xl font-bold">TABLETOP</h1>
      <Card className="w-full max-w-xs py-4">
        <CardContent>
          <FieldGroup>
            <Field>
              <Input placeholder="Session Code" className="text-center" />
              <FieldError />
            </Field>
            <Button className="w-full">Join Game</Button>
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  );
}

export default HomePage;
