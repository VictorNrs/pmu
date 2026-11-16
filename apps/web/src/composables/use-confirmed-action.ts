import { useDialog, useMessage } from 'naive-ui';

export interface ConfirmedDeletion {
  title: string;
  content: string;
  successMessage: string;
  action: () => Promise<void>;
  onSuccess?: () => void | Promise<void>;
}

/** Every deletion goes through an explicit confirmation and reports the API error if any. */
export function useConfirmedDeletion() {
  const dialog = useDialog();
  const message = useMessage();

  return (deletion: ConfirmedDeletion): void => {
    dialog.warning({
      title: deletion.title,
      content: deletion.content,
      positiveText: 'Supprimer',
      negativeText: 'Annuler',
      positiveButtonProps: { type: 'error' },
      onPositiveClick: async () => {
        try {
          await deletion.action();
          message.success(deletion.successMessage);
          await deletion.onSuccess?.();
        } catch (error) {
          message.error(error instanceof Error ? error.message : String(error), { duration: 6000 });
        }
      },
    });
  };
}

/** Runs a save action and shows the outcome; returns true on success. */
export function useFeedback() {
  const message = useMessage();
  return async (action: () => Promise<unknown>, successMessage: string): Promise<boolean> => {
    try {
      await action();
      message.success(successMessage);
      return true;
    } catch (error) {
      message.error(error instanceof Error ? error.message : String(error), { duration: 6000 });
      return false;
    }
  };
}
