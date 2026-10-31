import { createFormControl, createFormGroup } from "solid-forms";
import { For, Match, Switch } from "solid-js";

import { Trans, useLingui } from "@lingui/solid/macro";
import { Message as MessageI, User } from "stoat.js";
import { cva } from "styled-system/css";

import { Message } from "@revolt/app";
import {
  Avatar,
  Column,
  Dialog,
  DialogProps,
  Form2,
  MenuItem,
} from "@revolt/ui";

import { MotivRaport, trimiteRaportul } from "../../../src/bbt/raport";
import { useModals } from "..";
import { Modals } from "../types";

// BBT: doar motivele pe care le primește adminul (src/bbt/raport.ts).
const CONTENT_REPORT_REASONS: MotivRaport[] = [
  "Illegal",
  "PromotesHarm",
  "UnsolicitedSpam",
  "SpamAbuse",
  "ScamsFraud",
  "Harassment",
  "NoneSpecified",
];

const USER_REPORT_REASONS: MotivRaport[] = [
  "UnsolicitedSpam",
  "SpamAbuse",
  "InappropriateProfile",
  "Impersonation",
  "Underage",
  "NoneSpecified",
];

/**
 * Modal to report content
 */
export function ReportContentModal(
  props: DialogProps & Modals & { type: "report_content" },
) {
  const { t } = useLingui();
  const { showError } = useModals();

  const strings: Record<MotivRaport, string> = {
    Illegal: t`Content breaks one or more laws`,
    PromotesHarm: t`Promotes harm`,
    UnsolicitedSpam: t`Unsolicited advertising or spam`,
    SpamAbuse: t`Spam or similar platform abuse`,
    ScamsFraud: t`Scams or fraud`,
    Harassment: t`Harassment or cyberbullying`,
    NoneSpecified: t`Other`,

    InappropriateProfile: t`User's profile has inappropriate content`,
    Impersonation: t`Impersonation`,
    Underage: t`Not of minimum age to use the platform`,
  };

  const group = createFormGroup({
    category: createFormControl("", { required: true }),
    detail: createFormControl(""),
  });

  const reasons =
    // eslint-disable-next-line solid/reactivity
    props.target instanceof User ? USER_REPORT_REASONS : CONTENT_REPORT_REASONS;

  async function onSubmit() {
    try {
      const category = group.controls.category.value;
      const detail = group.controls.detail.value;

      if (!category || (category === "NoneSpecified" && !detail)) {
        throw new Error("NoReasonProvided");
      }

      const [, sesiune] = props.client.authenticationHeader;
      const raport = { motiv: category as MotivRaport, detalii: detail };
      await trimiteRaportul(
        sesiune,
        props.target instanceof User
          ? { ...raport, tip: "User", id: props.target.id }
          : {
              ...raport,
              tip: "Message",
              id: props.target.id,
              canalId: props.target.channelId,
            },
      );
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
      title={
        <Switch>
          <Match when={props.target instanceof User}>
            <Trans>Tell us what's wrong with this user</Trans>
          </Match>
          <Match when={props.target instanceof MessageI}>
            <Trans>Tell us what's wrong with this message</Trans>
          </Match>
        </Switch>
      }
      actions={[
        { text: <Trans>Cancel</Trans> },
        {
          text: <Trans>Report</Trans>,
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
          <div class={contentContainer()}>
            {props.target instanceof User ? (
              <Column align>
                <Avatar src={props.target.animatedAvatarURL} size={64} />
                {props.target.displayName}
              </Column>
            ) : (
              <Message message={props.target as never} />
            )}
          </div>

          <Form2.Select
            label={t`Reason for report`}
            control={group.controls.category}
          >
            <MenuItem>
              <Trans>Please select a reason</Trans>
            </MenuItem>
            <For each={reasons}>
              {(value) => <MenuItem value={value}>{strings[value]}</MenuItem>}
            </For>
          </Form2.Select>

          {/* TODO: use TextEditor? */}
          <Form2.TextField
            name="detail"
            control={group.controls.detail}
            label={t`Give us some detail`}
          />
        </Column>
      </form>
    </Dialog>
  );
}

const contentContainer = cva({
  base: {
    maxWidth: "100%",
    maxHeight: "80vh",
    overflowY: "hidden",
    "& > div": {
      marginTop: "0 !important",
      pointerEvents: "none",
      userSelect: "none",
    },
  },
});
