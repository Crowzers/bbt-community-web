import { createFormControl, createFormGroup } from "solid-forms";
import { createSignal } from "solid-js";

import { Trans, useLingui } from "@lingui/solid/macro";

import { useClient } from "@revolt/client";
import { useInstance } from "@revolt/instance";
import { useNavigate } from "@revolt/routing";
import { Column, Dialog, DialogProps, Form2, Radio2 } from "@revolt/ui";

import { useModals } from "..";
import { AlegeBeanbag } from "../../../src/bbt/AlegeBeanbag";
import { fisierBeanbag, propune, type Alegere, type Catalog } from "../../../src/bbt/beanbagCanale";
import { Modals } from "../types";

/**
 * Modal to create a new server channel
 */
export function CreateChannelModal(
  props: DialogProps & Modals & { type: "create_channel" },
) {
  const { t } = useLingui();
  const navigate = useNavigate();
  const { showError } = useModals();
  const client = useClient();
  const instance = useInstance();
  // Avatarul ales din bibliotecă. Se urcă după creare: iconul se pune pe un canal care există deja.
  const [avatar, setAvatar] = createSignal<{ alegere: Alegere; catalog: Catalog } | null>(null);

  const group = createFormGroup({
    name: createFormControl("", { required: true }),
    type: createFormControl("Text"),
  });

  async function onSubmit() {
    try {
      const channel = await props.server.createChannel({
        type: group.controls.type.value as "Text" | "Voice",
        name: group.controls.name.value,
      });

      // BBT: canalul există deja, deci un icon care n-a urcat nu trebuie să blocheze crearea; rămâne desenul după nume.
      const ales = avatar();
      if (ales) {
        try {
          const body = new FormData();
          body.append("file", await fisierBeanbag(ales.catalog, ales.alegere));
          const [key, value] = client().authenticationHeader;
          const raspuns = await fetch(`${instance.mediaUrl}/icons`, { method: "POST", body, headers: { [key]: value } });
          if (!raspuns.ok) throw new Error(String(raspuns.status));
          const { id } = (await raspuns.json()) as { id: string };
          await channel.edit({ icon: id });
        } catch (error) {
          showError(error);
        }
      }

      //Reorder categories
      const newChId = channel.id,
        catId = props.categoryId;
      if (catId && catId !== "default") {
        let ch, chIds;
        props.server.edit({
          categories: props.server.orderedChannels.map((cat) => {
            chIds = [];
            for (ch of cat.channels) if (ch.id !== newChId) chIds.push(ch.id);
            if (cat.id === catId) chIds.push(newChId);
            return { ...cat, channels: chIds };
          }),
        });
      }

      if (props.cb) {
        props.cb(channel);
      } else {
        navigate(`/server/${props.server.id}/channel/${newChId}`);
      }

      props.onClose();
    } catch (error) {
      showError(error);
    }
  }

  const submit = Form2.useSubmitHandler(group, onSubmit);

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Create channel</Trans>}
      actions={[
        { text: <Trans>Close</Trans> },
        {
          text: <Trans>Create</Trans>,
          onClick: () => {
            onSubmit();
            return false;
          },
          isDisabled: !Form2.canSubmit(group),
        },
      ]}
      isDisabled={group.isPending}
    >
      <form onSubmit={submit}>
        <Column>
          <Form2.TextField
            minlength={1}
            maxlength={32}
            counter
            name="name"
            control={group.controls.name}
            label={t`Channel Name`}
          />

          <Form2.Radio control={group.controls.type}>
            <Radio2.Option value="Text">
              <Trans>Text Channel</Trans>
            </Radio2.Option>
            <Radio2.Option value="Voice">
              <Trans>Voice Channel</Trans>
            </Radio2.Option>
          </Form2.Radio>

          <AlegeBeanbag
            propusa={(catalog) => propune(catalog, group.controls.name.value, group.controls.type.value === "Voice")}
            laSchimbare={(alegere, catalog) => setAvatar({ alegere, catalog })}
          />
        </Column>
      </form>
    </Dialog>
  );
}
