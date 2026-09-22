"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { deleteProduct } from "@/app/dashboard/(pages)/estoque/lib/actions";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function DeleteProductButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const [state, formAction, pending] = useActionState(deleteProduct.bind(null, productId), undefined);

  return (
    // The dialog is portaled, but React still bubbles its clicks through here to
    // the table row — stop them so they don't navigate to the product page.
    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={`Excluir ${productName}`}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </Button>
          }
        />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir este produto?</AlertDialogTitle>
            <AlertDialogDescription>
              {productName} sai do estoque e não poderá mais entrar em novas notas. As notas já
              emitidas continuam como estão.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {state?.success === false && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <form action={formAction}>
              <AlertDialogAction type="submit" variant="destructive" disabled={pending}>
                {pending ? "Excluindo..." : "Sim, excluir"}
              </AlertDialogAction>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
