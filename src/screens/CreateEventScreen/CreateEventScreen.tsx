import {
  Card,
  Input,
  Text,
  Select,
  CardSelect,
  Box,
  List,
  RangeSlider,
  Button,
} from "@components";
import { useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";

export function CreateEventScreen() {
  // TODO: use form
  const [name, setName] = useState("");
  const [danceStyle, setDanceStyle] = useState("");
  const [format, setFormat] = useState("");
  const [judgesAmount, setJudgesAmount] = useState<number>();

  const canSave = name && danceStyle && format && judgesAmount;

  return (
    <List>
      <Box gap={48} pb={300}>
        <Text variant="h1" centered color="primary">
          Event management
        </Text>
        <Card>
          <Text variant="h2" centered>
            Setup new battle
          </Text>
          <Input value={name} onChangeText={setName} label="Event Name" />
          <Select
            label="Dance Style"
            value={danceStyle}
            onChange={setDanceStyle}
            options={[
              { label: "HipHop", value: "hh" },
              { label: "House", value: "h" },
              { label: "Breaking", value: "b" },
              { label: "Experimental", value: "e" },
              { label: "Contemporary", value: "c" },
            ]}
          />
          <CardSelect
            value={format}
            label="Battle Format"
            onChange={setFormat}
            options={[
              { label: "TOP 8", value: "8" },
              { label: "TOP 16", value: "16" },
              { label: "TOP 32", value: "32" },
            ]}
          />
        </Card>
        <Card>
          <Text variant="h2" centered>
            Judging core
          </Text>

          <CardSelect
            value={judgesAmount}
            label="Number of judges"
            onChange={(value) => setJudgesAmount(Number(value))}
            options={[
              { label: "3", value: "3" },
              { label: "5", value: "5" },
              { label: "7", value: "7" },
            ]}
          />

          <Box mt={24}>
            <RangeSlider label="Quality score range" />
          </Box>
        </Card>
        <Box mt={24}>
          <Button
            disabled={!canSave}
            startIcon={
              <Ionicons name="rocket" size={32} style={{ color: "black" }} />
            }
          >
            <Text color="black" variant="h2">
              Create event
            </Text>
          </Button>
        </Box>
      </Box>
    </List>
  );
}
