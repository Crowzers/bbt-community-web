import { createFormControl, createFormGroup } from "solid-forms";
import { For, Match, Show, Switch, createSignal } from "solid-js";

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

import { useModals } from "..";
import {
  MotivRaport,
  eSensibil,
  textMotiv,
  trimiteRaportul,
} from "../../../src/bbt/raport";
import { Modals } from "../types";

// BBT: doar motivele pe care le primește adminul (src/bbt/raport.ts).
const CONTENT_REPORT_REASONS: MotivRaport[] = [
  "Urgent",
  "Illegal",
  "PromotesHarm",
  "UnsolicitedSpam",
  "SpamAbuse",
  "ScamsFraud",
  "Harassment",
  "NoneSpecified",
];

const USER_REPORT_REASONS: MotivRaport[] = [
  "Urgent",
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

  // BBT: motivul trimis; până atunci, formularul.
  const [trimis, setTrimis] = createSignal<MotivRaport | null>(null);

  const strings: Record<MotivRaport, string> = {
    Urgent: textMotiv("Urgent"),
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
      setTrimis(category as MotivRaport);
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
          <Match when={trimis()}>Mulțumim, am primit raportul</Match>
          <Match when={props.target instanceof User}>
            <Trans>Tell us what's wrong with this user</Trans>
          </Match>
          <Match when={props.target instanceof MessageI}>
            <Trans>Tell us what's wrong with this message</Trans>
          </Match>
        </Switch>
      }
      actions={
        trimis()
          ? [{ text: "Gata" }]
          : [
              { text: <Trans>Cancel</Trans> },
              {
                text: <Trans>Report</Trans>,
                onClick: () => {
                  onSubmit();
                  return false;
                },
                isDisabled: !Form2.canSubmit(group),
              },
            ]
      }
      isDisabled={group.isPending}
    >
      <Show when={trimis()}>
        {(motiv) => (
          <Column>
            <p style={{ margin: 0 }}>
              Echipa BBT îl verifică. Dacă omul te deranjează în continuare, îl
              poți bloca.
            </p>
            <Show when={eSensibil(motiv())}>
              <p style={{ margin: 0 }}>
                Dacă cineva e în pericol chiar acum, sună la{" "}
                <a href="tel:112">112</a>. Ai sub 18 ani și vrei să vorbești cu
                cineva? <a href="tel:116111">Telefonul Copilului, 116 111</a>, e
                gratuit.
              </p>
            </Show>
          </Column>
        )}
      </Show>
      <form onSubmit={submit} hidden={!!trimis()}>
        <Column>
          <p style={{ margin: 0 }}>
            Numele tău nu apare la cel raportat. Raportul îl vede doar echipa
            BBT.
          </p>
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
