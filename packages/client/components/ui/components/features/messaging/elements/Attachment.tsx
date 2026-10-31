import { Match, Show, Switch, createSignal } from "solid-js";

import { File, ImageEmbed, Message, VideoEmbed } from "stoat.js";
import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { MessageContextMenu, useMessage } from "@revolt/app";
import { useModals } from "@revolt/modal";
import { Column } from "@revolt/ui/components/layout";
import { SizedContent, Spoiler } from "@revolt/ui/components/utils";

import { BulaVocal } from "../../../../../../src/bbt/vocal/BulaVocal";
import { durataVocal } from "../../../../../../src/bbt/vocal/nume";

import { FileInfo } from "./FileInfo";
import { TextFile } from "./TextFile";

/**
 * List of attachments
 */
export const AttachmentContainer = styled(Column, {
  base: {
    padding: "var(--gap-md)",
    borderRadius: "var(--borderRadius-md)",
    color: "var(--md-sys-color-inverse-on-surface)",
    background: "var(--md-sys-color-inverse-surface)",
  },
});

/**
 * Render a given list of files
 */
export function Attachment(props: { file: File; message?: Message }) {
  const { openModal } = useModals();
  const { reactPicker } = useMessage();
  const [marimeVideo, setMarimeVideo] = createSignal<{
    width: number;
    height: number;
  }>();

  // BBT: video-ul are Play în mijloc, ca la WhatsApp și în aplicație (`mobil/src/fir/RandMesaj.tsx`: cerc de 52, negru
  // 45%). Comenzile browserului apar abia după prima pornire, altfel Play-ul lor stătea tot jos.
  const playPeMijloc = () => !props.file.isSpoiler;
  const [pornit, setPornit] = createSignal(false);
  const [redare, setRedare] = createSignal(false);
  let video: HTMLVideoElement | undefined;

  const meniuFisier = {
    contextMenu: () => (
      <MessageContextMenu
        message={props.message}
        reactPicker={reactPicker}
        file={props.file}
      />
    ),
  };

  return (
    <Switch fallback={`Could not render ${props.file.metadata.type}!`}>
      {/* BBT: vocalul (după nume, ca în aplicația mobilă) = bulă mică, înaintea oricărui tip de la autumn. */}
      <Match when={durataVocal(props.file.filename) !== null}>
        <div
          use:floating={{
            contextMenu: () => (
              <MessageContextMenu
                message={props.message}
                reactPicker={reactPicker}
                file={props.file}
              />
            ),
          }}
        >
          <BulaVocal
            file={props.file}
            durataMs={durataVocal(props.file.filename)!}
          />
        </div>
      </Match>
      <Match when={props.file.metadata.type === "Image"}>
        <SizedContent
          width={(props.file.metadata as ImageEmbed).width}
          height={(props.file.metadata as ImageEmbed).height}
        >
          <Show when={props.file.isSpoiler}>
            <Spoiler contentType="Image" />
          </Show>
          <img
            class={css({ cursor: "pointer" })}
            onClick={() =>
              openModal({
                type: "image_viewer",
                file: props.file,
              })
            }
            loading="lazy"
            src={props.file.createFileURL()}
            use:floating={{
              contextMenu: () => (
                <MessageContextMenu
                  message={props.message}
                  reactPicker={reactPicker}
                  file={props.file}
                />
              ),
            }}
          />
        </SizedContent>
      </Match>
      <Match when={props.file.metadata.type === "Video"}>
        <SizedContent
          width={
            marimeVideo()?.width ?? (props.file.metadata as VideoEmbed).width
          }
          height={
            marimeVideo()?.height ?? (props.file.metadata as VideoEmbed).height
          }
        >
          <Show when={props.file.isSpoiler}>
            <Spoiler contentType="Video" />
          </Show>
          <video
            ref={video}
            class={css({ background: "#000" })}
            controls={!playPeMijloc() || pornit()}
            playsinline
            preload="metadata"
            // BBT: fără `#t`, Safari de pe iPhone nu desenează niciun cadru până la Play și rămâne o cutie neagră.
            src={`${props.file.originalUrl}#t=0.001`}
            onPlay={() => {
              setPornit(true);
              setRedare(true);
            }}
            onPause={() => setRedare(false)}
            onEnded={() => setPornit(false)}
            // BBT: autumn citește lățimea și înălțimea din fișier fără rotație, deci un video filmat pe iPhone în picioare
            // venea culcat: caseta ieșea lată, iar pe lângă imagine se vedea bula. Browserul știe mărimea reală.
            onLoadedMetadata={(e) =>
              setMarimeVideo({
                width: e.currentTarget.videoWidth,
                height: e.currentTarget.videoHeight,
              })
            }
            use:floating={meniuFisier}
          />
          <Show when={playPeMijloc() && !redare()}>
            {/* Doar butonul prinde atingerea: restul rămâne al video-ului, cu apăsarea lungă și comenzile lui. */}
            <div
              class={`bbt-play-video ${css({
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1,
                pointerEvents: "none",
              })}`}
            >
              <button
                type="button"
                aria-label="Pornește video-ul"
                class={css({
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "52px",
                  height: "52px",
                  padding: 0,
                  border: 0,
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.45)",
                  cursor: "pointer",
                  pointerEvents: "auto",
                })}
                onClick={() => void video?.play()}
                use:floating={meniuFisier}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="#fff"
                  aria-hidden="true"
                  style={{ "margin-left": "3px" }}
                >
                  <path d="M6 3.5v17a1 1 0 0 0 1.5.86l14-8.5a1 1 0 0 0 0-1.72l-14-8.5A1 1 0 0 0 6 3.5Z" />
                </svg>
              </button>
            </div>
          </Show>
        </SizedContent>
      </Match>
      <Match when={props.file.metadata.type === "Audio"}>
        <AttachmentContainer>
          <FileInfo file={props.file} />
          <SizedContent width={360} height={48}>
            <audio
              controls
              src={props.file.originalUrl}
              use:floating={{
                contextMenu: () => (
                  <MessageContextMenu
                    message={props.message}
                    reactPicker={reactPicker}
                    file={props.file}
                  />
                ),
              }}
            />
          </SizedContent>
        </AttachmentContainer>
      </Match>
      <Match when={props.file.metadata.type === "File"}>
        <AttachmentContainer>
          <FileInfo file={props.file} />
        </AttachmentContainer>
      </Match>
      <Match when={props.file.metadata.type === "Text"}>
        <AttachmentContainer>
          <FileInfo file={props.file} />
          <SizedContent width={480} height={120}>
            <TextFile file={props.file} />
          </SizedContent>
        </AttachmentContainer>
      </Match>
    </Switch>
  );
}
