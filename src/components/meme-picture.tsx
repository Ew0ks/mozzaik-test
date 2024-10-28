import { Box, Text, useDimensions } from "@chakra-ui/react"
import { isNil } from "ramda"
import { useMemo, useRef, useState } from "react"
import DraggableCore, { DraggableData, DraggableEvent } from "react-draggable"

export type MemePictureProps = {
  pictureUrl: string
  texts: {
    content: string
    x: number
    y: number
  }[]
  dataTestId?: string
  isEditorMode?: boolean
  setTexts?: (updatedTexts: { content: string; x: number; y: number }[]) => void
}

const REF_WIDTH = 800
const REF_HEIGHT = 450
const REF_FONT_SIZE = 36

export const MemePicture: React.FC<MemePictureProps> = ({
  pictureUrl,
  texts,
  dataTestId = "",
  isEditorMode = false,
  setTexts = () => {},
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const dimensions = useDimensions(containerRef, true)
  const boxWidth: number | undefined = dimensions?.borderBox.width
  const boxHeight = dimensions?.borderBox.height

  const [indexDragged, setIndexDragged] = useState<number | null>(null)

  const { height, fontSize } = useMemo(() => {
    if (!boxWidth) {
      return { height: 0, fontSize: 0 }
    }

    return {
      height: (boxWidth / REF_WIDTH) * REF_HEIGHT,
      fontSize: (boxWidth / REF_WIDTH) * REF_FONT_SIZE,
    }
  }, [boxWidth])

  const handleDrag = (_: DraggableEvent, dragElement: DraggableData) => {
    if (isNil(indexDragged) || isNil(boxWidth) || isNil(boxHeight)) return
    console.log(
      {
        x: Math.round((dragElement.x * 100) / boxWidth),
        y: Math.round((dragElement.y * 100) / boxHeight),
      },
      "drag"
    )
    setTexts((prevTexts: MemePictureProps["texts"]) =>
      prevTexts.map((text, i) =>
        i === indexDragged
          ? {
              ...text,
              x: Math.round((dragElement.x * 100) / boxWidth),
              y: Math.round((dragElement.y * 100) / boxHeight),
            }
          : text
      )
    )
  }

  return (
    <Box
      width="full"
      height={height}
      ref={containerRef}
      backgroundImage={pictureUrl}
      backgroundColor="gray.100"
      backgroundPosition="center"
      backgroundRepeat="no-repeat"
      backgroundSize="contain"
      overflow="hidden"
      position="relative"
      borderRadius={8}
      data-testid={dataTestId}
    >
      {texts.map((text, index) => (
        <>
          {isEditorMode ? (
            <DraggableCore
              axis="none"
              onMouseDown={() => setIndexDragged(index)}
              onDrag={(e, dragElement) => {
                handleDrag(e, dragElement)
              }}
            >
              <Text
                key={index}
                fontSize={fontSize}
                position="absolute"
                left={`${text.x}%`}
                top={`${text.y}%`}
                translateY="0 !important"
                color="white"
                fontFamily="Impact"
                fontWeight="bold"
                display="inline-block"
                userSelect="none"
                cursor="move"
                textTransform="uppercase"
                style={{ WebkitTextStroke: "1px black" }}
                data-testid={`${dataTestId}-text-${index}`}
              >
                {text.content}
              </Text>
            </DraggableCore>
          ) : (
            <Text
              key={index}
              position="absolute"
              left={`${text.x}%`}
              top={`${text.y}%`}
              display="inline-block"
              fontSize={fontSize}
              color="white"
              fontFamily="Impact"
              fontWeight="bold"
              userSelect="none"
              textTransform="uppercase"
              style={{ WebkitTextStroke: "1px black" }}
              data-testid={`${dataTestId}-text-${index}`}
            >
              {text.content}
            </Text>
          )}
        </>
      ))}
    </Box>
  )
}
