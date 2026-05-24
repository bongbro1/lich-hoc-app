import React, { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { ImageFullModal } from "../components/ImageFullModal";

export type ImageFullModalOptions = {
  editableType?: "avatar" | "cover";
  onRequestChange?: () => void;
};

interface ModalContextType {
  openModal: (
    images: string[] | string,
    indexOrOptions?: number | ImageFullModalOptions,
    optionsArg?: ImageFullModalOptions
  ) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ImageFullModalProvider = ({ children }: { children: ReactNode }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [imageList, setImageList] = useState<string[]>([]);
  const [initialIndex, setInitialIndex] = useState(0);
  const [modalOptions, setModalOptions] = useState<ImageFullModalOptions>({});

  const openModal = (
    images: string[] | string,
    indexOrOptions: number | ImageFullModalOptions = 0,
    optionsArg?: ImageFullModalOptions
  ) => {
    const initialIndexValue =
      typeof indexOrOptions === "number" ? indexOrOptions : 0;
    const resolvedOptions =
      typeof indexOrOptions === "number" ? optionsArg ?? {} : indexOrOptions;

    if (typeof images === "string") {
      setImageList([images]);
      setInitialIndex(0);
    } else {
      setImageList(images);
      setInitialIndex(initialIndexValue);
    }

    setModalOptions(resolvedOptions);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalOptions({});
  };

  const value = useMemo(
    () => ({ openModal, closeModal }),
    []
  );

  return (
    <ModalContext.Provider value={value}>
      {children}

      <ImageFullModal
        visible={modalVisible}
        onClose={closeModal}
        images={imageList}
        initialIndex={initialIndex}
        editableType={modalOptions.editableType}
        onRequestChange={modalOptions.onRequestChange}
      />
    </ModalContext.Provider>
  );
};

export const useImageFullModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error("useImageFullModal must be used within ImageFullModalProvider");
  return context;
};
