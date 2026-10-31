import { Trans } from "@lingui/solid/macro";

import { Markdown } from "@revolt/markdown";
import { Dialog, DialogProps } from "@revolt/ui";

import { useNavigate } from "@revolt/routing";
import { Modals } from "../types";

export function ServerInfoModal(
  props: DialogProps & Modals & { type: "server_info" },
) {
  const navigate = useNavigate();

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
                  // BBT: Administrarea noastră, nu panoul lor.
                  navigate("/cont/administrare");
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
