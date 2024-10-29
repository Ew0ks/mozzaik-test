import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  Textarea,
  VStack,
} from "@chakra-ui/react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { MemeEditor } from "../../components/meme-editor"
import { useMemo, useState } from "react"
import { MemePictureProps } from "../../components/meme-picture"
import { Plus, Trash } from "@phosphor-icons/react"
import { useMutation } from "@tanstack/react-query"
import { CreateMeme, createMeme } from "../../api"
import { useAuthToken } from "../../contexts/authentication"
import { isNil, path, trim } from "ramda"

export const Route = createFileRoute("/_authentication/create")({
  component: CreateMemePage,
})

type Picture = {
  url: string
  file: File
}

function CreateMemePage() {
  const token = useAuthToken()
  const navigate = useNavigate({ from: "/create" })

  const [picture, setPicture] = useState<Picture | null>(null)
  const [texts, setTexts] = useState<MemePictureProps["texts"]>([])
  const [memeDescription, setMemeDescription] = useState<string>("")

  function objectToFormData(obj: Record<string, unknown>) {
    const formData = new FormData()

    Object.keys(obj).map((key) => {
      const value = obj[key]

      if (Array.isArray(value)) {
        value.map((item, index) => {
          Object.keys(item).map((keySec) => {
            const nestedValue = path([key, index, keySec], obj)
            formData.append(
              `${key}[${index}][${keySec}]`,
              nestedValue as string
            )
          })
        })
      } else {
        formData.append(key, value as string)
      }
    })

    return formData
  }

  const { mutate } = useMutation({
    mutationFn: async (content: FormData) => await createMeme(token, content),
    onSuccess: () => {
      navigate({ to: "/" })
    },
  })

  const handleSubmit = async () => {
    if (isNil(picture)) return
    const data: CreateMeme = {
      picture: picture.file,
      texts,
      description: memeDescription,
    }
    const payload = objectToFormData(data)
    mutate(payload)
  }

  const handleCaptionChange = (index: number, newText: string) => {
    setTexts((prevTexts) =>
      prevTexts.map((text, i) =>
        i === index ? { ...text, content: newText } : text
      )
    )
  }

  const handleDrop = (file: File) => {
    setPicture({
      url: URL.createObjectURL(file),
      file,
    })
  }

  const handleAddCaptionButtonClick = () => {
    setTexts((previousTexts) => [
      ...previousTexts,
      {
        content: `New caption ${texts.length + 1}`,
        x: 0,
        y: 0,
      },
    ])
  }

  const handleDeleteCaptionButtonClick = (index: number) => {
    setTexts(texts.filter((_, i) => i !== index))
  }

  const memePicture = useMemo(() => {
    if (!picture) {
      return undefined
    }

    return {
      pictureUrl: picture.url,
      texts,
      isEditorMode: true,
      setTexts: setTexts,
    }
  }, [picture, texts])

  return (
    <Flex width="full" height="full">
      <Box flexGrow={1} height="full" p={4} overflowY="auto">
        <VStack spacing={5} align="stretch">
          <Box>
            <Heading as="h2" size="md" mb={2}>
              Upload your picture
            </Heading>
            <MemeEditor onDrop={handleDrop} memePicture={memePicture} />
          </Box>
          <Box>
            <Heading as="h2" size="md" mb={2}>
              Describe your meme
            </Heading>
            <Textarea
              placeholder="Type your description here..."
              value={memeDescription}
              onChange={(e) => setMemeDescription(e.target.value)}
            />
          </Box>
        </VStack>
      </Box>
      <Flex
        flexDir="column"
        width="30%"
        minW="250"
        height="full"
        boxShadow="lg"
      >
        <Heading as="h2" size="md" mb={2} p={4}>
          Add your captions
        </Heading>
        <Box p={4} flexGrow={1} height={0} overflowY="auto">
          <VStack>
            {texts.map((text, index) => (
              <Flex width="full">
                <Input
                  key={index}
                  value={text.content}
                  onChange={(e) => handleCaptionChange(index, e.target.value)}
                  mr={1}
                />
                <IconButton
                  onClick={() => handleDeleteCaptionButtonClick(index)}
                  aria-label="Delete caption"
                  icon={<Icon as={Trash} />}
                />
              </Flex>
            ))}
            <Button
              colorScheme="cyan"
              leftIcon={<Icon as={Plus} />}
              variant="ghost"
              size="sm"
              width="full"
              onClick={handleAddCaptionButtonClick}
              isDisabled={memePicture === undefined}
            >
              Add a caption
            </Button>
          </VStack>
        </Box>
        <HStack p={4}>
          <Button
            as={Link}
            to="/"
            colorScheme="cyan"
            variant="outline"
            size="sm"
            width="full"
          >
            Cancel
          </Button>
          <Button
            colorScheme="cyan"
            size="sm"
            width="full"
            color="white"
            isDisabled={
              memePicture === undefined || !trim(memeDescription).length
            }
            onClick={() => handleSubmit()}
          >
            Submit
          </Button>
        </HStack>
      </Flex>
    </Flex>
  )
}
