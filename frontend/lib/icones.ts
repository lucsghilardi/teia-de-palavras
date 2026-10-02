import {
  Ambulance, Anchor, Apple, Atom, Baby, Backpack, Balloon, Banknote, Battery, Bed, Bell, Bike, Bird, Bone, Book, BookOpen, Bot, Box, Bug, Bus,
  Cake, Calculator, Calendar, Camera, Candy, Car, Carrot, Cat, Cherry, Circle, Clock, Cloud, CloudRain, Coins, Compass, Cone, Cookie, Cylinder,
  Diamond, Dice5, Dog, Droplet, Drum, Earth, Egg, Fish, Flag, Flame, Flashlight, Flower2, Footprints, Gamepad2, Gem, Gift, Globe, Guitar,
  Hammer, Hand, Hash, Heart, Hexagon, Hospital, Hourglass, House, IceCreamCone, Key, Leaf, Lightbulb, Lock, Map, MapPin, Medal, Milk, Moon,
  Mic, Mountain, Music, Network, Orbit, Package, Palette, PartyPopper, Pencil, Phone, Pizza, Plane, Puzzle, Rabbit, Radar, Rainbow, Rocket, Route, Ruler,
  Sailboat, Satellite, School, Scissors, Shell, Ship, Shirt, Signpost, Smile, Snail, Snowflake, Sparkles, Sprout, Square, Squirrel,
  Star, Store, Sun, Sunrise, Sunset, Telescope, Tent, Tractor, TrainFront, Trash2, TreePine, Triangle, Trophy, Turtle, Umbrella, User, Users,
  Utensils, Volleyball, Waves, Wind, Wrench, Zap, type LucideIcon,
} from "lucide-react";

/**
 * Ícones que o conteúdo (JSON das atividades, avatares, medalhas) pode citar
 * pelo nome, em kebab-case como no lucide. Nome desconhecido vira `sparkles`.
 */
export const ICONES: Record<string, LucideIcon> = {
  ambulance: Ambulance, anchor: Anchor, apple: Apple, atom: Atom, baby: Baby, backpack: Backpack, balloon: Balloon,
  banknote: Banknote, battery: Battery, bed: Bed, bell: Bell, bike: Bike, bird: Bird, bone: Bone, book: Book,
  "book-open": BookOpen, bot: Bot, box: Box, bug: Bug, bus: Bus, cake: Cake, calculator: Calculator, calendar: Calendar, camera: Camera, candy: Candy, car: Car,
  carrot: Carrot, cat: Cat, cherry: Cherry, circle: Circle, clock: Clock, cloud: Cloud, "cloud-rain": CloudRain, coins: Coins,
  compass: Compass, cone: Cone, cylinder: Cylinder,
  cookie: Cookie, diamond: Diamond, "dice-5": Dice5, dog: Dog, droplet: Droplet, drum: Drum, earth: Earth, egg: Egg, fish: Fish, flag: Flag,
  flame: Flame, flashlight: Flashlight, flower: Flower2, footprints: Footprints, "gamepad-2": Gamepad2, gem: Gem, gift: Gift, globe: Globe,
  guitar: Guitar, hammer: Hammer, hand: Hand, hash: Hash, heart: Heart, hexagon: Hexagon, hospital: Hospital, hourglass: Hourglass,
  house: House, "ice-cream-cone": IceCreamCone, key: Key, leaf: Leaf, lightbulb: Lightbulb, lock: Lock, map: Map, "map-pin": MapPin, medal: Medal,
  mic: Mic, milk: Milk, moon: Moon, mountain: Mountain, music: Music, network: Network, orbit: Orbit, package: Package, palette: Palette,
  "party-popper": PartyPopper, pencil: Pencil, phone: Phone, pizza: Pizza, plane: Plane, puzzle: Puzzle, rabbit: Rabbit, radar: Radar, rainbow: Rainbow,
  rocket: Rocket, route: Route, ruler: Ruler, sailboat: Sailboat, satellite: Satellite, school: School, scissors: Scissors,
  shell: Shell, ship: Ship, shirt: Shirt, signpost: Signpost, smile: Smile, snail: Snail, snowflake: Snowflake, sparkles: Sparkles,
  sprout: Sprout, square: Square, squirrel: Squirrel, star: Star, store: Store, sun: Sun, sunrise: Sunrise, sunset: Sunset, telescope: Telescope, tent: Tent,
  tractor: Tractor, train: TrainFront, "trash-2": Trash2, tree: TreePine, triangle: Triangle, trophy: Trophy, turtle: Turtle,
  umbrella: Umbrella, user: User, users: Users, utensils: Utensils, volleyball: Volleyball, waves: Waves, wind: Wind, wrench: Wrench, zap: Zap,
};

export function iconePorNome(nome: string | null | undefined): LucideIcon {
  return (nome && ICONES[nome]) || Sparkles;
}
