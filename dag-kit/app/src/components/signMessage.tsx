import React from "react";
import { useSignMessage } from "@dag-kit/react-rn";

export function SignMessageExample() {
  const { signMessage, isSigning } = useSignMessage();
  const [message, setMessage] = React.useState("");
  const [signature, setSignature] = React.useState("");

  const handleSign = async () => {
    try {
      const sig = await signMessage(message);
      setSignature(sig);
      alert("Message signed!");
    } catch (error) {
      console.error("Signing failed:", error);
      alert("Signing failed");
    }
  };

  return (
    <div className="sign-message">
      <h3>Sign Message</h3>
      <textarea
        placeholder="Enter message to sign"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={handleSign} disabled={isSigning || !message}>
        {isSigning ? "Signing..." : "Sign Message"}
      </button>
      {signature && (
        <div className="signature">
          <p>Signature:</p>
          <code>{signature}</code>
        </div>
      )}
    </div>
  );
}
