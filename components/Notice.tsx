import type { ComponentChild } from "preact";

interface Props {
  message: ComponentChild;
  color: string;
}

export default function Notice({ message, color }: Props) {
  return (
    <div class={`p-2 bg-${color}-100 text-${color}-700 rounded mb-4`}>
      <strong>Note:</strong> {message}
    </div>
  );
}
