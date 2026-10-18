export const animals = [
  ['dog', 'Pes'], ['cat', 'Kočka'], ['rabbit', 'Králík'], ['hamster', 'Křeček'],
  ['horse', 'Kůň'], ['cow', 'Kráva'], ['pig', 'Prase'], ['sheep', 'Ovce'],
  ['chicken', 'Slepice'], ['duck', 'Kachna'], ['lion', 'Lev'], ['tiger', 'Tygr'],
  ['elephant', 'Slon'], ['giraffe', 'Žirafa'], ['zebra', 'Zebra'], ['bear', 'Medvěd'],
  ['panda', 'Panda'], ['monkey', 'Opice'], ['fox', 'Liška'], ['frog', 'Žába'],
  ['penguin', 'Tučňák'], ['turtle', 'Želva'], ['dolphin', 'Delfín'], ['whale', 'Velryba'],
  ['octopus', 'Chobotnice'], ['crab', 'Krab'], ['trex', 'T-Rex'],
  ['brontosaurus', 'Brontosaurus'], ['triceratops', 'Triceratops'], ['stegosaurus', 'Stegosaurus'],
].map(([id, name]) => ({ id, name, asset: `./assets/animals/${id}.svg` }));
