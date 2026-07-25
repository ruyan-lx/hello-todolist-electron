export type MessageAlertInput =
  | string
  | {
    message: string;
    title?: string;
  };

const normalize = (input: MessageAlertInput) => {
  return typeof input === "string" ? { message: input } : input;
};

const hasElectronDialog = () => {
  return typeof window !== "undefined" && Boolean(window.api?.invoke);
};

export const message = {
  async alert(input: MessageAlertInput) {
    const options = normalize(input);

    if (hasElectronDialog()) {
      await window.api.invoke("dialog:info", options.message);
      return;
    }

    window.alert(options.title ? `${options.title}\n\n${options.message}` : options.message);
  },
};
