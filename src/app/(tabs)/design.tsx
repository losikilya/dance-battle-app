import {
  Avatar,
  AvatarStack,
  Box,
  Button,
  Card,
  IconButton,
  List,
  ListItem,
  Text,
} from "@components";
import Ionicons from "@expo/vector-icons/Ionicons";
import { HEADER_HEIGHT } from "@constants/Dimensions";
import Colors from "@constants/Colors";

export default function Design(): React.JSX.Element {
  return (
    <Box fullHeight fullWidth color={Colors.dark.background}>
      <List>
        <Box p={24} pt={48 + HEADER_HEIGHT} align="center" gap={48} pb={500}>
          <Box fullWidth align="center" gap={12}>
            <Box mb={24}>
              <Text variant="h1" color="primary">
                Typography
              </Text>
            </Box>
            <Text variant="h1">Text h1</Text>
            <Text variant="h1" color="textSecondary">
              Text h1
            </Text>
            <Text variant="h1" color="error">
              Text h1
            </Text>
            <Card
              roundBorder
              style={{
                borderColor: Colors.secondary.dark,
                borderWidth: 4,
              }}
            >
              <Box fullWidth align="center">
                <Text variant="h1" color="secondary">
                  Text h1
                </Text>
              </Box>
            </Card>

            <Text variant="h2">Text h2</Text>
            <Text variant="h2" color="textSecondary">
              Text h2
            </Text>
            <Text variant="body">Text body</Text>
            <Text variant="body" color="textSecondary">
              Text body
            </Text>
            <Text variant="bodyBold">Text body bold</Text>
            <Text variant="bodyBold" color="textSecondary">
              Text body bold
            </Text>
            <Text variant="caption">Text caption</Text>
            <Text variant="caption" color="textSecondary">
              Text caption
            </Text>
            <Text variant="button">Text button</Text>
            <Text variant="button" color="textSecondary">
              Text button
            </Text>
          </Box>
          <Box fullWidth pt={24} align="center" gap={12}>
            <Box gap={12}>
              <Text centered variant="h1" color="primary">
                Button
              </Text>
              <Button>Primary</Button>
              <Button color="secondary">Secondary</Button>
              <Button variant="outlined">Outlined</Button>
              <Button variant="text">Text</Button>
              <Box
                color={Colors.primary.main}
                p={24}
                direction="row"
                gap={24}
                justify="center"
                align="center"
              >
                <IconButton variant="contained">
                  <Ionicons name="settings-outline" size={24} />
                </IconButton>
                <IconButton>
                  <Ionicons name="settings-outline" size={24} />
                </IconButton>
              </Box>
            </Box>
          </Box>

          <Box fullWidth pt={24} align="center" gap={48} style={{ flex: 1 }}>
            <Box mb={24}>
              <Text variant="h1" color="primary">
                Cards
              </Text>
            </Box>
            <Box fullWidth fullHeight gap={24}>
              <Card
                blurred
                roundBorder
                size="small"
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  backgroundColor: Colors.dark.backgroundLight,
                }}
              >
                <Box
                  fullWidth
                  fullHeight
                  justify="center"
                  direction="row"
                  align="center"
                  gap={12}
                >
                  <Avatar />
                  <Text variant="caption">username</Text>
                </Box>
              </Card>
              <Card
                size="medium"
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  backgroundColor: Colors.dark.backgroundLight,
                }}
              >
                <Box
                  fullWidth
                  fullHeight
                  justify="center"
                  direction="row"
                  align="center"
                  gap={12}
                >
                  <Avatar />
                  <Text variant="caption">username</Text>
                </Box>
              </Card>
              <Card
                dark
                size="small"
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  backgroundColor: Colors.dark.backgroundLight,
                }}
              >
                <Box
                  fullWidth
                  fullHeight
                  justify="center"
                  direction="row"
                  align="center"
                  gap={12}
                >
                  <Avatar />
                  <Text variant="caption">username</Text>
                </Box>
              </Card>
            </Box>
          </Box>

          <Box fullWidth pt={24} align="center" gap={12}>
            <Box gap={12} align="center">
              <Text variant="h1" color="primary">
                Avatar
              </Text>

              <Box p={24} direction="row" gap={24} align="center">
                <Avatar uri="https://fastly.picsum.photos/id/668/200/300.jpg?blur=2&hmac=2To7zb-Htpyzgvexh79rkYihKsuLtyn0RpMwRGQitcU" />
                <Avatar
                  size="medium"
                  uri="https://fastly.picsum.photos/id/668/200/300.jpg?blur=2&hmac=2To7zb-Htpyzgvexh79rkYihKsuLtyn0RpMwRGQitcU"
                />
                <Avatar
                  size="large"
                  uri="https://fastly.picsum.photos/id/668/200/300.jpg?blur=2&hmac=2To7zb-Htpyzgvexh79rkYihKsuLtyn0RpMwRGQitcU"
                />
                <Avatar
                  size="large"
                  squared
                  uri="https://fastly.picsum.photos/id/668/200/300.jpg?blur=2&hmac=2To7zb-Htpyzgvexh79rkYihKsuLtyn0RpMwRGQitcU"
                />
              </Box>

              <AvatarStack>
                <Avatar uri="https://fastly.picsum.photos/id/668/200/300.jpg?blur=2&hmac=2To7zb-Htpyzgvexh79rkYihKsuLtyn0RpMwRGQitcU" />
                <Avatar uri="https://fastly.picsum.photos/id/668/200/300.jpg?blur=2&hmac=2To7zb-Htpyzgvexh79rkYihKsuLtyn0RpMwRGQitcU" />
                <Avatar uri="https://fastly.picsum.photos/id/668/200/300.jpg?blur=2&hmac=2To7zb-Htpyzgvexh79rkYihKsuLtyn0RpMwRGQitcU" />
              </AvatarStack>
            </Box>
          </Box>

          <Box fullWidth pt={24} align="center" gap={12}>
            <Box mb={24}>
              <Text variant="h1" color="primary">
                List
              </Text>
            </Box>
            <List divided>
              <ListItem>
                <Text variant="bodyBold">List Item</Text>
              </ListItem>
              <ListItem>
                <Box gap={6}>
                  <Text variant="bodyBold">List Item</Text>
                  <Text color="textSecondary">List Item</Text>
                </Box>
              </ListItem>
              <ListItem>
                <Text variant="bodyBold">List Item</Text>
              </ListItem>
              <ListItem
                icon={
                  <Avatar
                    size="medium"
                    uri="https://fastly.picsum.photos/id/668/200/300.jpg?blur=2&hmac=2To7zb-Htpyzgvexh79rkYihKsuLtyn0RpMwRGQitcU"
                  />
                }
              >
                <Text variant="bodyBold">List Item</Text>
              </ListItem>
            </List>
          </Box>
        </Box>
      </List>
    </Box>
  );
}
