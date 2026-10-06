import { Trans } from "@lingui/solid/macro";

import { Markdown } from "@revolt/markdown";
import { Dialog, DialogProps } from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

export function ServerInfoModal(
  props: DialogProps & Modals & { type: "server_info" },
) {
  const { openModal } = useModals();

  const canOpenSettings = () =>
    props.server.orPermission(
      "ManageServer",
      "ManageCustomisation",
      "ManageRole",
      "ManagePermissions",
    );

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={props.server.name}
      actions={[
        ...(canOpenSettings()
          ? [
              {
                text: <Trans>Settings</Trans>,
                onClick() {
                  openModal({
                    type: "settings",
                    config: "server",
                    context: props.server,
                  });
                },
              },
            ]
          : []),
        // BBT: fără „Edit Identity" (numele și poza vin din contul BBT) și fără „Report" (serverul
        // e al nostru) — „nu fac sens pentru noi" (6 oct 2026).
        { text: <Trans>Close</Trans> },
      ]}
    >
      <Markdown content={props.server.description!} />
    </Dialog>
  );
}
