const {
  ChatInputCommandInteraction,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");
const { Module, onButton } = require("../index");
const { randomUUID } = require("crypto");
const TicTacToe = require("./lib/tictactoe");

const Game = {};


Module(
  {
    name: "tictactoe",
    description: "Tic Tac Toe game",
  },async(m)=>{
    const room = {
      id: randomUUID(),
      x: m.jid,
      o: "",
      game: new TicTacToe(m.user.id, "o"),
      state: "WAITING",
    };
    Game[room.id] = room;
    const join = new ButtonBuilder()
      .setLabel("Join")
      .setStyle(ButtonStyle.Primary)
      .setCustomId(`tttjoin-${room.id}`);
  
    const row = new ActionRowBuilder().addComponents(join);
    return await m.reply({
      content: `${m.user} started a new game of tic tac toe..`,
      components: [row],
    });
  }
  
);
onButton(
  {
    name: "tttjoin",
  },
  async (m) => {
    const id = m.customId.split("tttjoin-")[1];
    const room = Game[id];
    if(!room)return await m.reply({
        content: "Game not found",
        ephemeral: true,
      });
    if(room.game.playerX == m.user.id) return await m.reply({
        content: "You are already a player",
        ephemeral: true,
      });
    room.game.playerO = m.user.id
    room.state = "PLAYING";

    let arr = room.game.render().map((v) => {
        return v === "X" || v === "O"
          ? new ButtonBuilder().setLabel(v).setStyle(ButtonStyle.Primary).setCustomId(`tttpla-${room.id},${v}`)
          : new ButtonBuilder().setLabel("⠀").setStyle(ButtonStyle.Primary).setCustomId(`tttplay-${room.id},${v}`);
      });

    let msg = `Current turn: <@${room.game.currentTurn}>\n⭕:- <@${room.game.playerO}>\n❌:- <@${room.game.playerX}>`;
    const firstRow = new ActionRowBuilder().addComponents(arr.slice(0, 3));
    const secondRowRow = new ActionRowBuilder().addComponents(arr.slice(3, 6));
    const thirdRow = new ActionRowBuilder().addComponents(arr.slice(6));
    const surrender = new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel("Surrender").setStyle(ButtonStyle.Danger).setCustomId(`tttplay-${room.id},surrender`));

    await m.update({
      content: msg,
      components: [firstRow, secondRowRow, thirdRow,surrender],
    });
  }
);

onButton(
  {
    name: "tttplay",
  },
  async (m) => {
    const [id, number] = m.customId.split("tttplay-")[1].split(",");
    const room = Game[id];
    if (!room || ![room.game.playerX, room.game.playerO].includes(m.user.id))
      return await m.reply({
        content: "Game not found",
        ephemeral: true,
      });
    let ok;
    let isWin = false;
    let isTie = false;
    let isSurrender = number == "surrender";

    if ( !isSurrender &&
      1 >
      (ok = room.game.turn(
        m.user.id === room.game.playerO,
        parseInt(number) - 1
      ))
    ) {
      m.reply({
        content: {
          "-3": "The game is over.",
          "-2": "Invalid",
          "-1": "_Invalid Position_",
          0: "_Invalid Position_",
        }[ok],
        ephemeral: true,
      });
      return !0;
    }
    if (m.user.id === room.game.winner) isWin = true;
    else if (room.game.board === 511) isTie = true;
    let arr = room.game.render().map((v) => {
        return v === "X" || v === "O"
          ? new ButtonBuilder().setLabel(v).setStyle(ButtonStyle.Primary).setCustomId(`tttplay-${randomUUID()}`)
          : new ButtonBuilder().setLabel("⠀").setStyle(ButtonStyle.Primary).setCustomId(`tttplay-${room.id},${v}`);
      });
      

      if (isSurrender) {
        room.game._currentTurn = m.user.id === room.game.playerX;
        isWin = true;
      }
      let winner = isSurrender ? room.game.currentTurn : room.game.winner;
    let msg = `
        ${
        isWin?
            `<@${winner}> Won ! and got 100💎 in wallet🤑`
            :isTie?
            `Game Tied,well done to both of you players.`
            :
            `Current Turn ${["❌", "⭕"][1 * room.game._currentTurn]} <@${room.game.currentTurn}>`
        }\n⭕:- <@${room.game.playerO}>\n❌:- <@${room.game.playerX}>`;

    const firstRow = new ActionRowBuilder().addComponents(arr.slice(0, 3));
    const secondRowRow = new ActionRowBuilder().addComponents(arr.slice(3, 6));
    const thirdRow = new ActionRowBuilder().addComponents(arr.slice(6));
    const surrender = new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel("Surrender").setStyle(ButtonStyle.Danger).setCustomId(`tttplay-${room.id},surrender`));


    if (isWin || isTie) {
        delete Game[room.id];
        await m.update({
            content: msg,
            components: [firstRow, secondRowRow, thirdRow],
          });
      } else {
        await m.update({
            content: msg,
            components: [firstRow, secondRowRow, thirdRow,surrender],
          });
      }
  }
);

