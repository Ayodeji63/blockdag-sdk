import { Dialog, DialogTrigger } from "@radix-ui/react-dialog";
import { useTurnkey } from "@turnkey/react-wallet-kit";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";

export default function AddPasskey({
  onPasskeyAdded,
}: {
  onPasskeyAdded: (authenticatorId: string) => void;
}) {
  const { user, handleAddPasskey } = useTurnkey();

  const [open, setOpen] = useState(false);
  const [passkeyName, setPasskeyName] = useState("");

  const _handleAddPasskey = async () => {
    if (!user) {
      return;
    }

    const [authenticatorId] = await handleAddPasskey({
      name: passkeyName,
      displayName: passkeyName,
      userId: user?.userId,
    });

    if (authenticatorId) {
      toast.success("Passkey added successfully");
      onPasskeyAdded(authenticatorId);
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="text-xs sm:text-sm" variant="outline" size={"sm"}>
          Add Passkey
        </Button>
      </DialogTrigger>
    </Dialog>
  );
}
