import {
  Button,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useDemoBattleStore } from "../../stores/demoBattle/useDemoBattleStore";

const SCORE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function DemoBattleScreen() {
  const event = useDemoBattleStore((state) => state.event);
  const participants = useDemoBattleStore((state) => state.participants);
  const judges = useDemoBattleStore((state) => state.judges);
  const scores = useDemoBattleStore((state) => state.scores);
  const battles = useDemoBattleStore((state) => state.battles);
  const votes = useDemoBattleStore((state) => state.votes);
  const currentQualificationParticipantIndex = useDemoBattleStore(
    (state) => state.currentQualificationParticipantIndex,
  );

  const getRanking = useDemoBattleStore((state) => state.getRanking);
  const getParticipantName = useDemoBattleStore(
    (state) => state.getParticipantName,
  );
  const getChampionId = useDemoBattleStore((state) => state.getChampionId);
  const getCurrentQualificationParticipant = useDemoBattleStore(
    (state) => state.getCurrentQualificationParticipant,
  );
  const getScoresForCurrentParticipant = useDemoBattleStore(
    (state) => state.getScoresForCurrentParticipant,
  );

  const canStartQualification = useDemoBattleStore(
    (state) => state.canStartQualification,
  );
  const canGoToNextQualificationParticipant = useDemoBattleStore(
    (state) => state.canGoToNextQualificationParticipant,
  );
  const canFinishQualification = useDemoBattleStore(
    (state) => state.canFinishQualification,
  );
  const canGenerateTop8 = useDemoBattleStore((state) => state.canGenerateTop8);
  const canGenerateNextRound = useDemoBattleStore(
    (state) => state.canGenerateNextRound,
  );

  const resetDemo = useDemoBattleStore((state) => state.resetDemo);
  const startQualification = useDemoBattleStore(
    (state) => state.startQualification,
  );
  const submitQualificationScore = useDemoBattleStore(
    (state) => state.submitQualificationScore,
  );
  const goToNextQualificationParticipant = useDemoBattleStore(
    (state) => state.goToNextQualificationParticipant,
  );
  const finishQualification = useDemoBattleStore(
    (state) => state.finishQualification,
  );
  const fillRandomQualificationScores = useDemoBattleStore(
    (state) => state.fillRandomQualificationScores,
  );
  const generateTop8 = useDemoBattleStore((state) => state.generateTop8);
  const submitRandomVotesForBattle = useDemoBattleStore(
    (state) => state.submitRandomVotesForBattle,
  );
  const generateNextRound = useDemoBattleStore(
    (state) => state.generateNextRound,
  );

  const ranking = getRanking();
  const championId = getChampionId();
  const currentParticipant = getCurrentQualificationParticipant();
  const currentParticipantScores = getScoresForCurrentParticipant();

  const isStartQualificationAvailable = canStartQualification();
  const isNextParticipantAvailable = canGoToNextQualificationParticipant();
  const isFinishQualificationAvailable = canFinishQualification();
  const isTop8GenerationAvailable = canGenerateTop8();
  const isNextRoundGenerationAvailable = canGenerateNextRound();

  const getVotesForBattle = useDemoBattleStore(
    (state) => state.getVotesForBattle,
  );
  const getJudgeVoteForBattle = useDemoBattleStore(
    (state) => state.getJudgeVoteForBattle,
  );
  const canStartBattle = useDemoBattleStore((state) => state.canStartBattle);
  const canSubmitBattleVote = useDemoBattleStore(
    (state) => state.canSubmitBattleVote,
  );

  const startBattle = useDemoBattleStore((state) => state.startBattle);
  const submitBattleVote = useDemoBattleStore(
    (state) => state.submitBattleVote,
  );

  const getJudgeScore = (judgeId: string) => {
    if (!currentParticipant) {
      return null;
    }

    return (
      currentParticipantScores.find((score) => score.judgeId === judgeId)
        ?.score ?? null
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.subtitle}>{event.categoryTitle}</Text>
          <Text style={styles.status}>Status: {event.status}</Text>
        </View>

        <Button title="Reset" onPress={resetDemo} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Participants</Text>

        {participants.map((participant) => (
          <Text key={participant.id} style={styles.text}>
            #{participant.number} {participant.name} — {participant.crew}
          </Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Qualification Control</Text>

        <Button
          title="Start qualification"
          onPress={startQualification}
          disabled={!isStartQualificationAvailable}
        />

        <Button
          title="Fill random qualification scores"
          onPress={fillRandomQualificationScores}
        />

        {event.status === "qualification" && currentParticipant && (
          <View style={styles.qualificationCard}>
            <Text style={styles.cardLabel}>
              Participant {currentQualificationParticipantIndex + 1} /{" "}
              {participants.length}
            </Text>

            <Text style={styles.currentParticipantName}>
              #{currentParticipant.number} {currentParticipant.name}
            </Text>

            <Text style={styles.text}>
              {currentParticipant.crew} / {currentParticipant.city}
            </Text>

            <View style={styles.judgesList}>
              {judges.map((judge) => {
                const selectedScore = getJudgeScore(judge.id);

                return (
                  <View key={judge.id} style={styles.judgeScoreBlock}>
                    <Text style={styles.judgeName}>
                      {judge.name}:{" "}
                      {selectedScore ? `${selectedScore}/10` : "not scored"}
                    </Text>

                    <View style={styles.scoreGrid}>
                      {SCORE_OPTIONS.map((score) => {
                        const isSelected = selectedScore === score;

                        return (
                          <Pressable
                            key={score}
                            style={[
                              styles.scoreButton,
                              isSelected && styles.scoreButtonSelected,
                            ]}
                            onPress={() =>
                              submitQualificationScore({
                                participantId: currentParticipant.id,
                                judgeId: judge.id,
                                score,
                              })
                            }
                          >
                            <Text
                              style={[
                                styles.scoreButtonText,
                                isSelected && styles.scoreButtonTextSelected,
                              ]}
                            >
                              {score}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>

            {currentQualificationParticipantIndex ===
              participants.length - 1 && (
              <Text style={styles.text}>
                This is the last participant. Submit all scores and finish
                qualification.
              </Text>
            )}

            <Button
              title="Next participant"
              onPress={goToNextQualificationParticipant}
              disabled={!isNextParticipantAvailable}
            />

            <Button
              title="Finish qualification"
              onPress={finishQualification}
              disabled={!isFinishQualificationAvailable}
            />
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ranking</Text>

        {scores.length === 0 ? (
          <Text style={styles.text}>No scores yet</Text>
        ) : (
          ranking.map((item) => (
            <Text key={item.participantId} style={styles.text}>
              #{item.rank} {getParticipantName(item.participantId)} —{" "}
              {item.averageScore.toFixed(2)} / scores: {item.scoresCount}
            </Text>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bracket</Text>

        <Button
          title="Generate Top 8"
          onPress={generateTop8}
          disabled={!isTop8GenerationAvailable}
        />

        {battles.map((battle) => {
          const battleVotes = getVotesForBattle(battle.id);
          const isBattleStartAvailable = canStartBattle(battle.id);
          const isBattleVoteAvailable = canSubmitBattleVote(battle.id);

          return (
            <View key={battle.id} style={styles.battleCard}>
              <Text style={styles.battleTitle}>
                {battle.round.toUpperCase()} / Battle {battle.slot}
              </Text>

              <Text style={styles.text}>Status: {battle.status}</Text>

              <Text style={styles.text}>
                A: {getParticipantName(battle.participantAId)}
              </Text>

              <Text style={styles.text}>
                B: {getParticipantName(battle.participantBId)}
              </Text>

              {battle.status === "pending" && (
                <Button
                  title="Start battle"
                  onPress={() => startBattle(battle.id)}
                  disabled={!isBattleStartAvailable}
                />
              )}

              {isBattleVoteAvailable && (
                <View style={styles.votePanel}>
                  <Text style={styles.votePanelTitle}>Judges votes</Text>

                  {judges.map((judge) => {
                    const judgeVote = getJudgeVoteForBattle(
                      battle.id,
                      judge.id,
                    );

                    const votedForA =
                      judgeVote?.winnerId === battle.participantAId;
                    const votedForB =
                      judgeVote?.winnerId === battle.participantBId;

                    return (
                      <View key={judge.id} style={styles.judgeVoteBlock}>
                        <Text style={styles.judgeName}>
                          {judge.name}:{" "}
                          {judgeVote
                            ? getParticipantName(judgeVote.winnerId)
                            : "not voted"}
                        </Text>

                        <View style={styles.voteButtonsRow}>
                          <Pressable
                            style={[
                              styles.voteButton,
                              votedForA && styles.voteButtonSelected,
                            ]}
                            onPress={() =>
                              submitBattleVote({
                                battleId: battle.id,
                                judgeId: judge.id,
                                winnerId: battle.participantAId,
                              })
                            }
                          >
                            <Text
                              style={[
                                styles.voteButtonText,
                                votedForA && styles.voteButtonTextSelected,
                              ]}
                            >
                              Vote A
                            </Text>
                          </Pressable>

                          <Pressable
                            style={[
                              styles.voteButton,
                              votedForB && styles.voteButtonSelected,
                            ]}
                            onPress={() =>
                              submitBattleVote({
                                battleId: battle.id,
                                judgeId: judge.id,
                                winnerId: battle.participantBId,
                              })
                            }
                          >
                            <Text
                              style={[
                                styles.voteButtonText,
                                votedForB && styles.voteButtonTextSelected,
                              ]}
                            >
                              Vote B
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    );
                  })}

                  <Text style={styles.text}>
                    Votes submitted: {battleVotes.length} / {judges.length}
                  </Text>
                </View>
              )}

              {battle.winnerId && (
                <View style={styles.resultBlock}>
                  <Text style={styles.winner}>
                    Winner: {getParticipantName(battle.winnerId)}
                  </Text>

                  <Text style={styles.text}>Vote breakdown:</Text>

                  {battleVotes.map((vote) => (
                    <Text key={vote.id} style={styles.text}>
                      {judges.find((judge) => judge.id === vote.judgeId)
                        ?.name ?? "Unknown judge"}{" "}
                      → {getParticipantName(vote.winnerId)}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        {battles.length > 0 && (
          <Button
            title="Generate next round"
            onPress={generateNextRound}
            disabled={!isNextRoundGenerationAvailable}
          />
        )}
      </View>

      {championId && (
        <View style={styles.section}>
          <Text style={styles.finalWinner}>
            Champion: {getParticipantName(championId)}
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Debug</Text>
        <Text style={styles.text}>Scores: {scores.length}</Text>
        <Text style={styles.text}>Votes: {votes.length}</Text>
        <Text style={styles.text}>Battles: {battles.length}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 18,
    opacity: 0.7,
  },
  status: {
    marginTop: 4,
    fontSize: 14,
    opacity: 0.7,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  text: {
    fontSize: 15,
  },
  qualificationCard: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    gap: 16,
  },
  cardLabel: {
    fontSize: 13,
    opacity: 0.7,
  },
  currentParticipantName: {
    fontSize: 24,
    fontWeight: "800",
  },
  judgesList: {
    gap: 16,
  },
  judgeScoreBlock: {
    gap: 8,
  },
  judgeName: {
    fontSize: 16,
    fontWeight: "700",
  },
  scoreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  scoreButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#999",
    alignItems: "center",
    justifyContent: "center",
  },
  scoreButtonSelected: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  scoreButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  scoreButtonTextSelected: {
    color: "#fff",
  },
  battleCard: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    gap: 8,
  },
  battleTitle: {
    fontWeight: "700",
  },
  winner: {
    fontWeight: "700",
  },
  finalWinner: {
    fontSize: 24,
    fontWeight: "800",
  },
  votePanel: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    gap: 12,
  },

  votePanelTitle: {
    fontSize: 16,
    fontWeight: "700",
  },

  judgeVoteBlock: {
    gap: 8,
  },

  voteButtonsRow: {
    flexDirection: "row",
    gap: 8,
  },

  voteButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#999",
    alignItems: "center",
  },

  voteButtonSelected: {
    backgroundColor: "#111",
    borderColor: "#111",
  },

  voteButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },

  voteButtonTextSelected: {
    color: "#fff",
  },

  resultBlock: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f3f3f3",
    gap: 6,
  },
});
