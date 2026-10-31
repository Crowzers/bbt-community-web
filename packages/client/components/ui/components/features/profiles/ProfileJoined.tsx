import { ServerMember, User } from "stoat.js";

import { Text } from "../../design";

import { ProfileCard } from "./ProfileCard";

const luna = new Intl.DateTimeFormat("ro-RO", {
  month: "long",
  year: "numeric",
});

/**
 * BBT: un singur rând, „Membru din octombrie 2026", ca „Din …" din mini-profil (`src/bbt/MiniProfil.tsx`). Blocul Stoat
 * arăta „Joined / Stoat" și încă o dată numele serverului: în hub există un singur server, iar numele Stoat nu se arată.
 */
export function ProfileJoined(props: { user: User; member?: ServerMember }) {
  return (
    <ProfileCard>
      <Text class="title" size="large">
        Membru din
      </Text>
      <Text>{luna.format(props.member?.joinedAt ?? props.user.createdAt)}</Text>
    </ProfileCard>
  );
}
