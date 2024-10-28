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
import { createFileRoute, Link } from "@tanstack/react-router"
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

  const [picture, setPicture] = useState<Picture | null>(null)
  const [texts, setTexts] = useState<MemePictureProps["texts"]>([])
  const [memeDescription, setMemeDescription] = useState<string>("")

  /*   const convertToBase64 = (
    file: File
  ): Promise<string | ArrayBuffer | null> => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader()
      fileReader.readAsDataURL(file)
      fileReader.onload = () => {
        resolve(fileReader.result)
      }
      fileReader.onerror = (error) => {
        reject(error)
      }
    })
  } */

  function objectToFormData(obj: unknown) {
    const formData = new FormData()

    // Obtenir les clés de l'objet
    Object.keys(obj).map((key) => {
      const value = obj[key]

      // Vérifier si la valeur est un tableau
      if (Array.isArray(value)) {
        value.map((item, index) => {
          Object.keys(item).map((keySec) => {
            console.log(
              `${key}[${index}][${keySec}]: ${path([key, index, keySec], obj)}`,
              "map"
            )
            formData.append(
              `${key}[${index}][${keySec}]`,
              path([key, index, keySec], obj)
            )
          })
        }) // Utiliser [] pour les tableaux
      } else {
        formData.append(key, value) // Ajouter la clé/valeur
      }
    })

    return formData
  }

  const { mutate } = useMutation({
    mutationFn: async (content: FormData) => await createMeme(token, content),
    onSuccess: (data) => {
      console.log(data, "data success")
    },
  })

  const handleSubmit = async () => {
    if (isNil(picture)) return
    /*     const base64 = await convertToBase64(picture.file)
    if (typeof base64 !== "string") return */
    const data: CreateMeme = {
      picture: picture.file,
      texts,
      description: memeDescription,
    }
    console.log(data, "data")
    const payload = objectToFormData(data)
    for (const pair of payload.entries()) {
      console.log(pair[0] + ", " + pair[1], "formData")
    }
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
        x: Math.round(Math.random() * 400),
        y: Math.round(Math.random() * 225),
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
