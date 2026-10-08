import { Show, createResource } from "solid-js";

import { Trans } from "@lingui/solid/macro";
import { useNavigate } from "@solidjs/router";
import { PublicBot, ServerMember, User } from "stoat.js";
import { styled } from "styled-system/jsx";

import { UserContextMenu } from "@revolt/app";
import { useClient } from "@revolt/client";
import { useModals } from "@revolt/modal";

import MdCancel from "@material-design-icons/svg/filled/cancel.svg?component-solid";
import MdEdit from "@material-design-icons/svg/filled/edit.svg?component-solid";
import MdMoreVert from "@material-design-icons/svg/filled/more_vert.svg?component-solid";

import { Button, IconButton } from "../../design";
import { iconSize } from "../../utils";

/**
 * Actions shown on profile cards
 */
export function ProfileActions(props: {
  width: 2 | 3;

  user: User;
  member?: ServerMember;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const client = useClient();
  const { openModal } = useModals();

  const [publicBot] = createResource(
    () => props.user.bot && props.user.id,
    (id) =>
      client()
        .bots.fetchPublic(id)
        .then((b) => (b instanceof PublicBot ? b : new PublicBot(client(), b)))
        .catch(() => {}),
  );

  /**
   * Open direct message channel
   */
  function openDm() {
    props.user.openDM().then((channel) => navigate(channel.path));
    props.onClose();
  }

  /**
   * Open edit menu
   */
  function openEdit() {
    // BBT: propriul profil = mereu profilul BBT, și din server. Identitatea pe server (alt nume/altă
    // poză doar aici) ar fi acoperit numele și poza din contul BBT — un server, o identitate.
    // ⚠️ Pe ALTCINEVA rămâne ca la ei: moderatorii resetează de aici porecla/poza unui membru.
    if (props.user.self) {
      openModal({
        type: "settings",
        config: "user",
        context: { page: "profile" },
      });
      props.onClose();
      return;
    }
    openModal(
      props.member
        ? { type: "server_identity", member: props.member }
        : { type: "settings", config: "user" },
    );
    if (!props.member) props.onClose();
  }

  return (
    <Actions width={props.width}>
      <Show when={props.user.relationship === "None" && !props.user.bot}>
        {/* BBT: în română — interfața e forțată pe română (Locale.ts), iar textele astea nu trec
            prin cataloage. */}
        <Button onPress={() => props.user.addFriend()}>
          Adaugă la prieteni
        </Button>
      </Show>
      <Show when={props.user.relationship === "Incoming"}>
        <Button onPress={() => props.user.addFriend()}>
          Acceptă prietenia
        </Button>
        <IconButton onPress={() => props.user.removeFriend()}>
          <MdCancel />
        </IconButton>
      </Show>
      <Show when={props.user.relationship === "Outgoing"}>
        <Button onPress={() => props.user.removeFriend()}>
          Anulează cererea
        </Button>
      </Show>
      <Show when={props.user.relationship === "Friend"}>
        <Button onPress={openDm}>Mesaj</Button>
      </Show>
      <Show when={publicBot()}>
        <Button
          onPress={() =>
            openModal({
              type: "add_bot",
              invite: publicBot()!,
            })
          }
        >
          <Trans>Add Bot</Trans>
        </Button>
      </Show>

      <Show
        when={
          // BBT: propriul profil se editează mereu (în BBT), fără permisiunile de identitate pe server.
          props.user.self ||
          (props.member
            ? (props.member.server!.havePermission("ManageNicknames") ||
                props.member.server!.havePermission("RemoveAvatars")) &&
              props.member.inferiorTo(props.member!.server!.member!)
            : false)
        }
      >
        <IconButton onPress={openEdit}>
          <MdEdit {...iconSize(16)} />
        </IconButton>
      </Show>

      <IconButton
        use:floating={{
          contextMenu: () => (
            <UserContextMenu
              user={props.user}
              member={props.member}
              onClose={props.onClose}
            />
          ),
          contextMenuHandler: "click",
        }}
      >
        <MdMoreVert />
      </IconButton>
    </Actions>
  );
}

const Actions = styled("div", {
  base: {
    display: "flex",
    gap: "var(--gap-md)",
    justifyContent: "flex-end",
  },
  variants: {
    width: {
      3: {
        gridColumn: "1 / 4",
      },
      2: {
        gridColumn: "1 / 3",
      },
    },
  },
});
