import { startTransition, type FormEvent } from "react";

// React 19 resets every uncontrolled field once a `<form action>` finishes, even
// when the action returned validation errors — so the user loses what they typed.
// Submitting through `onSubmit` + `startTransition` runs the same action (pending
// state and `useActionState` included) without triggering that reset.
export function keepFormValues(action: (payload: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => action(formData));
  };
}
