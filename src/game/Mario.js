import { LevelUpdateInstance as LevelUpdate } from "./LevelUpdate"
import { AreaInstance as Area } from "./Area"
import { MarioMiscInstance as MarioMisc } from "./MarioMisc"
import { CameraInstance as Camera } from "./Camera"
import { ObjectListProcessorInstance as ObjectListProcessor } from "./ObjectListProcessor"
import { GRAPH_RENDER_INVISIBLE, geo_update_animation_frame, retrieve_animation_index } from "../engine/graph_node"
import { SurfaceCollisionInstance as SurfaceCollision } from "../engine/SurfaceCollision"
import * as SurfaceTerrains from "../include/surface_terrains"
import { atan2s, vec3s_set } from "../engine/math_util"
import { mario_execute_stationary_action } from "./MarioActionsStationary"
import { gMarioAnimData } from "../actors/mario/marioAnimData"
import { mario_execute_moving_action } from "./MarioActionsMoving"
import { mario_execute_airborne_action } from "./MarioActionsAirborne"
import { mario_execute_object_action } from "./MarioActionsObject"
import { mario_execute_submerged_action } from "./MarioActionsSubmerged"
import { oMarioWalkingPitch, oInteractStatus, oPosX, oPosY, oPosZ, oMoveAnglePitch, oMoveAngleRoll, oMoveAngleYaw, oMarioSteepJumpYaw } from "../include/object_constants"
import * as Interact from "./Interaction"
import { mario_execute_automatic_action } from "./MarioActionsAutomatic"
import { mario_execute_cutscene_action } from "./MarioActionsCutscene"
import { gameData as socketGameData } from "../mmo/socket"
import { int16, sins, coss } from "../utils"
import * as MarioConstants from "../include/mario_constants"

////// Mario Constants
export const ANIM_FLAG_NOLOOP = (1 << 0) // 0x01
export const ANIM_FLAG_FORWARD = (1 << 1) // 0x02
export const ANIM_FLAG_2 = (1 << 2) // 0x04
export const ANIM_FLAG_HOR_TRANS = (1 << 3) // 0x08
export const ANIM_FLAG_VERT_TRANS = (1 << 4) // 0x10
export const ANIM_FLAG_5 = (1 << 5) // 0x20
export const ANIM_FLAG_6 = (1 << 6) // 0x40
export const ANIM_FLAG_7 = (1 << 7) // 0x80

// after processing an object, the type is reset to this
export const ANIM_TYPE_NONE = 0

// Not all parts have full animation: to save space, some animations only
// have xz, y, or no translation at all. All animations have rotations though
export const ANIM_TYPE_TRANSLATION = 1
export const ANIM_TYPE_VERTICAL_TRANSLATION = 2
export const ANIM_TYPE_LATERAL_TRANSLATION = 3
export const ANIM_TYPE_NO_TRANSLATION = 4

// Every animation includes rotation, after processing any of the above
// translation types the type is set to this
export const ANIM_TYPE_ROTATION = 5

export const MARIO_ANIM_FALL_OVER_BACKWARDS = 0x01
export const MARIO_ANIM_IDLE_HEAD_LEFT = 0xC3
export const MARIO_ANIM_IDLE_HEAD_RIGHT = 0xC4
export const MARIO_ANIM_IDLE_HEAD_CENTER = 0xC5
export const MARIO_ANIM_BACKWARD_AIR_KB = 0x02
export const MARIO_ANIM_IDLE_ON_LEDGE = 0x33
export const MARIO_ANIM_CLIMB_DOWN_LEDGE = 0x1C
export const MARIO_ANIM_FAST_LEDGE_GRAB = 0x34
export const MARIO_ANIM_SLOW_LEDGE_GRAB = 0x00
export const MARIO_ANIM_MOVE_ON_WIRE_NET_RIGHT = 0x5C
export const MARIO_ANIM_MOVE_ON_WIRE_NET_LEFT = 0x5D
export const MARIO_ANIM_HANDSTAND_LEFT = 0xC6
export const MARIO_ANIM_HANDSTAND_RIGHT = 0xC7
export const MARIO_ANIM_WALKING = 0x48
export const MARIO_ANIM_RUNNING = 0x72
export const MARIO_ANIM_SKID_ON_GROUND = 0x0F
export const MARIO_ANIM_STOP_SKID = 0x10
export const MARIO_ANIM_TURNING_PART1 = 0xBC
export const MARIO_ANIM_TURNING_PART2 = 0xBD
export const MARIO_ANIM_LAND_FROM_SINGLE_JUMP = 0x4E
export const MARIO_ANIM_SINGLE_JUMP = 0x4D
export const MARIO_ANIM_GENERAL_FALL = 0x56
export const MARIO_ANIM_GENERAL_LAND = 0x57
export const MARIO_ANIM_SLIDEFLIP_LAND = 0xBE
export const MARIO_ANIM_SLIDEFLIP = 0xBF
export const MARIO_ANIM_LAND_FROM_DOUBLE_JUMP = 0x4B
export const MARIO_ANIM_DOUBLE_JUMP_FALL = 0x4C
export const MARIO_ANIM_DOUBLE_JUMP_RISE = 0x50
export const MARIO_ANIM_TRIPLE_JUMP_LAND = 0xC0
export const MARIO_ANIM_TRIPLE_JUMP = 0xC1
export const MARIO_ANIM_GROUND_KICK = 0x66
export const MARIO_ANIM_FIRST_PUNCH = 0x67
export const MARIO_ANIM_SECOND_PUNCH = 0x68
export const MARIO_ANIM_FIRST_PUNCH_FAST = 0x69
export const MARIO_ANIM_SECOND_PUNCH_FAST = 0x6A
export const MARIO_ANIM_CLIMB_UP_POLE = 0x05
export const MARIO_ANIM_GRAB_POLE_SHORT = 0x06
export const MARIO_ANIM_GRAB_POLE_SWING_PART1 = 0x07
export const MARIO_ANIM_GRAB_POLE_SWING_PART2 = 0x08
export const MARIO_ANIM_HANDSTAND_IDLE = 0x09
export const MARIO_ANIM_HANDSTAND_JUMP = 0x0A
export const MARIO_ANIM_START_HANDSTAND = 0x0B
export const MARIO_ANIM_RETURN_FROM_HANDSTAND = 0x0C
export const MARIO_ANIM_IDLE_ON_POLE = 0x0D
export const MARIO_ANIM_SLIDEJUMP = 0xCB
export const MARIO_ANIM_STOP_CROUCHING = 0x96
export const MARIO_ANIM_START_CROUCHING = 0x97
export const MARIO_ANIM_CROUCHING = 0x98
export const MARIO_ANIM_CRAWLING = 0x99
export const MARIO_ANIM_STOP_CRAWLING = 0x9A
export const MARIO_ANIM_START_CRAWLING = 0x9B
export const MARIO_ANIM_BACKFLIP = 0x04
export const MARIO_ANIM_BREAKDANCE = 0x71
export const MARIO_ANIM_FAST_LONGJUMP = 0x13
export const MARIO_ANIM_SLOW_LONGJUMP = 0x14
export const MARIO_ANIM_CROUCH_FROM_FAST_LONGJUMP = 0x11
export const MARIO_ANIM_CROUCH_FROM_SLOW_LONGJUMP = 0x12
export const MARIO_ANIM_DIVE = 0x88
export const MARIO_ANIM_SLIDE_DIVE = 0x89
export const MARIO_ANIM_SLOW_LAND_FROM_DIVE = 0x5A
export const MARIO_ANIM_AIRBORNE_ON_STOMACH = 0x15
export const MARIO_ANIM_LAND_ON_STOMACH = 0x2C
export const MARIO_ANIM_STOP_SLIDE = 0x8F
export const MARIO_ANIM_FALL_FROM_SLIDE = 0x90
export const MARIO_ANIM_SLIDE = 0x91
export const MARIO_ANIM_AIR_KICK = 0x4F
export const MARIO_ANIM_HANG_ON_CEILING = 0x35
export const MARIO_ANIM_FORWARD_SPINNING = 0x6F
export const MARIO_ANIM_BACKWARD_SPINNING = 0x70
export const MARIO_ANIM_START_TIPTOE = 0xCA
export const MARIO_ANIM_TIPTOE = 0x92
export const MARIO_ANIM_SLIDE_KICK = 0x8C
export const MARIO_ANIM_CROUCH_FROM_SLIDE_KICK = 0x8D
export const MARIO_ANIM_FALL_FROM_SLIDE_KICK = 0x53
export const MARIO_ANIM_GROUND_POUND_LANDING = 0x3A
export const MARIO_ANIM_TRIPLE_JUMP_GROUND_POUND = 0x3B
export const MARIO_ANIM_START_GROUND_POUND = 0x3C
export const MARIO_ANIM_GROUND_POUND = 0x3D
export const MARIO_ANIM_BOTTOM_STUCK_IN_GROUND = 0x3E
export const MARIO_ANIM_SOFT_BACK_KB = 0x74
export const MARIO_ANIM_SOFT_FRONT_KB = 0x75
export const MARIO_ANIM_BACKWARD_KB = 0x7B
export const MARIO_ANIM_FORWARD_KB = 0x7C
export const MARIO_ANIM_START_WALLKICK = 0xCC
export const MARIO_ANIM_STAND_AGAINST_WALL = 0x7E
export const MARIO_ANIM_PUSHING = 0x6C
export const MARIO_ANIM_SIDESTEP_LEFT = 0x7F
export const MARIO_ANIM_SIDESTEP_RIGHT = 0x80
export const MARIO_ANIM_CREDITS_WAVING = 0x1D
export const MARIO_ANIM_STAR_DANCE = 0xCD
export const MARIO_ANIM_DROWNING_PART1 = 0xA5
export const MARIO_ANIM_DROWNING_PART2 = 0xA6
export const MARIO_ANIM_WATER_IDLE_WITH_OBJ = 0xA4
export const MARIO_ANIM_WATER_IDLE = 0xB2
export const MARIO_ANIM_WATER_ACTION_END_WITH_OBJ = 0xA2 // either swimming or flutterkicking
export const MARIO_ANIM_WATER_ACTION_END = 0xAD  // either swimming or flutterkicking
export const MARIO_ANIM_STOP_GRAB_OBJ_WATER = 0xa3
export const MARIO_ANIM_BACKWARDS_WATER_KB = 0x9E 
export const MARIO_ANIM_WATER_FORWARD_KB = 0xA8 
export const MARIO_ANIM_SHOCKED = 0x7A 
export const MARIO_ANIM_FLUTTERKICK_WITH_OBJ = 0xA1 
export const MARIO_ANIM_FLUTTERKICK = 0xAC 
export const MARIO_ANIM_FALL_WITH_LIGHT_OBJ = 0x43 
export const MARIO_ANIM_SWIM_PART1 = 0xAA 
export const MARIO_ANIM_SWIM_PART2 = 0xAB 
export const MARIO_ANIM_WATER_PICK_UP_OBJ = 0xAE
export const MARIO_ANIM_WATER_GRAB_OBJ_PART2 = 0xAF 
export const MARIO_ANIM_WATER_GRAB_OBJ_PART1 = 0xB0 

export const MARIO_ANIM_SLIDING_ON_BOTTOM_WITH_LIGHT_OBJ = 0x45

export const MARIO_ANIM_DYING_FALL_OVER 	= 0x32
export const MARIO_ANIM_DYING_ON_BACK 		= 0x03
export const MARIO_ANIM_DYING_ON_STOMACH 	= 0x2E
export const MARIO_ANIM_SUFFOCATING 	= 0x2F



export const MARIO_NORMAL_CAP = 0x00000001
export const MARIO_VANISH_CAP = 0x00000002
export const MARIO_METAL_CAP = 0x00000004
export const MARIO_WING_CAP = 0x00000008
export const MARIO_CAP_ON_HEAD = 0x00000010
export const MARIO_CAP_IN_HAND = 0x00000020
export const MARIO_METAL_SHOCK = 0x00000040
export const MARIO_TELEPORTING = 0x00000080
export const MARIO_UNKNOWN_08 = 0x00000100
export const MARIO_UNKNOWN_13 = 0x00002000
export const MARIO_ACTION_SOUND_PLAYED = 0x00010000
export const MARIO_MARIO_SOUND_PLAYED = 0x00020000
export const MARIO_UNKNOWN_18 = 0x00040000
export const MARIO_PUNCHING = 0x00100000
export const MARIO_KICKING = 0x00200000
export const MARIO_TRIPPING = 0x00400000
export const MARIO_UNKNOWN_25 = 0x02000000
export const MARIO_UNKNOWN_30 = 0x40000000
export const MARIO_UNKNOWN_31 = 0x80000000

export const ACT_ID_MASK = 0x000001FF

export const ACT_GROUP_MASK = 0x000001C0
export const ACT_GROUP_STATIONARY = (0 << 6)
export const ACT_GROUP_MOVING = (1 << 6)
export const ACT_GROUP_AIRBORNE = (2 << 6)
export const ACT_GROUP_SUBMERGED = (3 << 6)
export const ACT_GROUP_CUTSCENE = (4 << 6)
export const ACT_GROUP_AUTOMATIC = (5 << 6)
export const ACT_GROUP_OBJECT = (6 << 6)
export const ACT_IDLE = 0x0C400201
export const ACT_WALKING = 0x04000440
export const ACT_DECELERATING = 0x0400044A
export const ACT_BRAKING = 0x04000445
export const ACT_STANDING_AGAINST_WALL = 0x0C400209
export const ACT_BRAKING_STOP = 0x0C00023D
export const ACT_TURNING_AROUND = 0x00000443
export const ACT_FINISH_TURNING_AROUND = 0x00000444
export const ACT_CRAWLING = 0x04008448
export const ACT_JUMP = 0x03000880
export const ACT_JUMP_LAND = 0x04000470
export const ACT_FREEFALL = 0x0100088C
export const ACT_FREEFALL_LAND = 0x04000471
export const ACT_FREEFALL_LAND_STOP = 0x0C000232
export const ACT_DOUBLE_JUMP    = 0x03000881
export const ACT_JUMP_LAND_STOP = 0x0C000230
export const ACT_BEGIN_SLIDING = 0x00000050
export const ACT_LONG_JUMP = 0x03000888
export const ACT_SIDE_FLIP = 0x01000887
export const ACT_SIDE_FLIP_LAND = 0x04000473
export const ACT_SIDE_FLIP_LAND_STOP = 0x0C000233
export const ACT_DOUBLE_JUMP_LAND = 0x04000472
export const ACT_DOUBLE_JUMP_LAND_STOP = 0x0C000231
export const ACT_TRIPLE_JUMP = 0x01000882
export const ACT_TRIPLE_JUMP_LAND = 0x04000478
export const ACT_TRIPLE_JUMP_LAND_STOP = 0x0800023A
export const ACT_PUNCHING = 0x00800380
export const ACT_GRAB_POLE_SLOW = 0x00100341
export const ACT_GRAB_POLE_FAST = 0x00100342
export const ACT_HOLDING_POLE = 0x08100340
export const ACT_CLIMBING_POLE            =  0x00100343
export const ACT_TOP_OF_POLE_TRANSITION   =  0x00100344
export const ACT_TOP_OF_POLE              =  0x00100345
export const ACT_START_HANGING = 0x08200348
export const ACT_WALL_KICK_AIR = 0x03000886
export const ACT_TOP_OF_POLE_JUMP = 0x0300088D
export const ACT_CROUCHING                =  0x0C008220 
export const ACT_START_CROUCHING          =  0x0C008221 
export const ACT_STOP_CROUCHING           =  0x0C008222 
export const ACT_START_CRAWLING           =  0x0C008223 
export const ACT_STOP_CRAWLING            =  0x0C008224 
export const ACT_BACKFLIP                 =  0x01000883
export const ACT_BACKFLIP_LAND            =  0x0400047A 
export const ACT_BACKFLIP_LAND_STOP       =  0x0800022F
export const ACT_CROUCH_SLIDE             =  0x04808459 
export const ACT_LONG_JUMP_LAND           = 0x00000479
export const ACT_LONG_JUMP_LAND_STOP      =  0x0800023B 
export const ACT_BBH_ENTER_SPIN           =  0x00001535
export const ACT_SLIDE_KICK = 0x018008AA
export const ACT_DIVE = 0x0188088A
export const ACT_JUMP_KICK = 0x018008AC
export const ACT_STOMACH_SLIDE_STOP = 0x00000386
export const ACT_STOMACH_SLIDE = 0x008C0453
export const ACT_DIVE_SLIDE = 0x00880456
export const ACT_FORWARD_ROLLOUT = 0x010008A6
export const ACT_BACKWARD_ROLLOUT = 0x010008AD
export const ACT_MOVE_PUNCHING = 0x00800457 
export const ACT_SLIDE_KICK_SLIDE = 0x0080045A
export const ACT_SLIDE_KICK_SLIDE_STOP = 0x08000225
export const ACT_SHOCKWAVE_BOUNCE = 0x00020226
export const ACT_FIRST_PERSON = 0x0C000227
export const ACT_GROUND_POUND = 0x008008A9
export const ACT_GROUND_POUND_LAND = 0x0080023C
export const ACT_BUTT_SLIDE_STOP = 0x0C00023E
export const ACT_AIR_HIT_WALL = 0x000008A7
export const ACT_RIDING_HOOT = 0x000004A8
export const ACT_SLEEPING = 0x0C000203
export const ACT_START_SLEEPING = 0x0C400202
export const ACT_THROWN_BACKWARD = 0x010208BE
export const ACT_KNOCKED_UP = 0x010208BF
export const ACT_LEDGE_CLIMB_DOWN = 0x0000054E
export const ACT_LEDGE_CLIMB_SLOW_1 = 0x0000054C
export const ACT_LEDGE_GRAB = 0x0800034B
export const ACT_LEDGE_CLIMB_FAST = 0x0000054F
export const ACT_SOFT_BONK = 0x010208B6
export const ACT_LEDGE_CLIMB_SLOW_2 = 0x0000054D
export const ACT_HANG_MOVING = 0x0020054A
export const ACT_HANGING = 0x00200349
export const ACT_BUTT_SLIDE = 0x00840452
export const ACT_HOLD_BUTT_SLIDE = 0x00840454
export const ACT_RIDING_SHELL_GROUND = 0x20810446
export const ACT_TWIRL_LAND = 0x18800238
export const ACT_TWIRLING = 0x108008A4
export const ACT_IN_CANNON               = 0x00001371
export const ACT_BUTT_SLIDE_AIR          = 0x0300088E
export const ACT_HOLD_BUTT_SLIDE_AIR = 0x010008A2
export const ACT_STEEP_JUMP = 0x03000885
export const ACT_BUTT_STUCK_IN_GROUND = 0x0002033B
export const ACT_FEET_STUCK_IN_GROUND = 0x0002033C
export const ACT_VERTICAL_WIND = 0x1008089C
export const ACT_SQUISHED = 0x00020339
export const ACT_STANDING_DEATH = 0x00021311
export const ACT_SUFFOCATION      = 0x00021314 // (0x114 | ACT_FLAG_STATIONARY | ACT_FLAG_INTANGIBLE | ACT_FLAG_INVULNERABLE)
export const ACT_DEATH_ON_STOMACH = 0x00021315 // (0x115 | ACT_FLAG_STATIONARY | ACT_FLAG_INTANGIBLE | ACT_FLAG_INVULNERABLE)
export const ACT_DEATH_ON_BACK    = 0x00021316 // (0x116 | ACT_FLAG_STATIONARY | ACT_FLAG_INTANGIBLE | ACT_FLAG_INVULNERABLE)





export const ACT_HARD_BACKWARD_GROUND_KB  =  0x00020460 
export const ACT_HARD_FORWARD_GROUND_KB   =  0x00020461 
export const ACT_BACKWARD_GROUND_KB       =  0x00020462 
export const ACT_FORWARD_GROUND_KB        =  0x00020463 
export const ACT_SOFT_BACKWARD_GROUND_KB  =  0x00020464 
export const ACT_SOFT_FORWARD_GROUND_KB = 0x00020465 
export const ACT_BACKWARD_AIR_KB       =  0x010208B0 
export const ACT_FORWARD_AIR_KB        =  0x010208B1 
export const ACT_HARD_FORWARD_AIR_KB   =  0x010208B2 
export const ACT_HARD_BACKWARD_AIR_KB  =  0x010208B3

// group 0x0C0: submerged actions
export const ACT_WATER_IDLE                =0x380022C0 
export const ACT_HOLD_WATER_IDLE           =0x380022C1 
export const ACT_WATER_ACTION_END          =0x300022C2 
export const ACT_HOLD_WATER_ACTION_END     =0x300022C3 
export const ACT_DROWNING                  =0x300032C4 
export const ACT_BACKWARD_WATER_KB         =0x300222C5 
export const ACT_FORWARD_WATER_KB          =0x300222C6 
export const ACT_WATER_DEATH               =0x300032C7 
export const ACT_WATER_SHOCKED             =0x300222C8 
export const ACT_BREASTSTROKE              =0x300024D0 
export const ACT_SWIMMING_END              =0x300024D1 
export const ACT_FLUTTER_KICK              =0x300024D2 
export const ACT_HOLD_BREASTSTROKE         =0x300024D3 
export const ACT_HOLD_SWIMMING_END         =0x300024D4 
export const ACT_HOLD_FLUTTER_KICK         =0x300024D5 
export const ACT_WATER_SHELL_SWIMMING      =0x300024D6 
export const ACT_WATER_THROW               =0x300024E0 
export const ACT_WATER_PUNCH               =0x300024E1 
export const ACT_WATER_PLUNGE              =0x300022E2 
export const ACT_CAUGHT_IN_WHIRLPOOL       =0x300222E3 
export const ACT_METAL_WATER_STANDING      =0x080042F0 
export const ACT_HOLD_METAL_WATER_STANDING =0x080042F1 
export const ACT_METAL_WATER_WALKING       =0x000044F2 
export const ACT_HOLD_METAL_WATER_WALKING  =0x000044F3 
export const ACT_METAL_WATER_FALLING       =0x000042F4 
export const ACT_HOLD_METAL_WATER_FALLING  =0x000042F5 
export const ACT_METAL_WATER_FALL_LAND     =0x000042F6 
export const ACT_HOLD_METAL_WATER_FALL_LAND=0x000042F7 
export const ACT_METAL_WATER_JUMP          =0x000044F8 
export const ACT_HOLD_METAL_WATER_JUMP     =0x000044F9 
export const ACT_METAL_WATER_JUMP_LAND     =0x000044FA 
export const ACT_HOLD_METAL_WATER_JUMP_LAND=0x000044FB 

export const ACT_WATER_JUMP       = 0x01000889
export const ACT_HOLD_WATER_JUMP  = 0x010008A3




export const AIR_STEP_CHECK_LEDGE_GRAB = 0x00000001
export const AIR_STEP_CHECK_HANG = 0x00000002
export const AIR_STEP_NONE            =  0
export const AIR_STEP_LANDED          =  1
export const AIR_STEP_HIT_WALL        =  2
export const AIR_STEP_GRABBED_LEDGE   =  3
export const AIR_STEP_GRABBED_CEILING =  4
export const AIR_STEP_HIT_LAVA_WALL   =  6

export const ACT_FLAG_STATIONARY = (1 << 9)
export const ACT_FLAG_MOVING = (1 << 10)
export const ACT_FLAG_AIR = (1 << 11)
export const ACT_FLAG_INTANGIBLE = (1 << 12)
export const ACT_FLAG_SWIMMING = (1 << 13)
export const ACT_FLAG_METAL_WATER = (1 << 14)
export const ACT_FLAG_SHORT_HITBOX = (1 << 15)
export const ACT_FLAG_RIDING_SHELL = (1 << 16)
export const ACT_FLAG_INVULNERABLE = (1 << 17)
export const ACT_FLAG_BUTT_OR_STOMACH_SLIDE = (1 << 18)
export const ACT_FLAG_DIVING = (1 << 19)
export const ACT_FLAG_ON_POLE = (1 << 20)
export const ACT_FLAG_HANGING = (1 << 21)
export const ACT_FLAG_IDLE = (1 << 22)
export const ACT_FLAG_ATTACKING = (1 << 23)
export const ACT_FLAG_ALLOW_VERTICAL_WIND_ACTION = (1 << 24)
export const ACT_FLAG_CONTROL_JUMP_HEIGHT = (1 << 25)
export const ACT_FLAG_ALLOW_FIRST_PERSON = (1 << 26)
export const ACT_FLAG_PAUSE_EXIT = (1 << 27)
export const ACT_FLAG_SWIMMING_OR_FLYING = (1 << 28)
export const ACT_FLAGWATER_OR_TEXT = (1 << 29)
export const ACT_FLAG_THROWING = (1 << 31)
export const ACT_TAUNT = (0x193 | ACT_FLAG_STATIONARY | ACT_FLAG_IDLE)
export const ACT_PARACHUTING = 0x1100088C
export const ACT_KARTING = 0x10840452


//Used by m.canGlide for determining max amount of glider uses per action.
const PARACHUTE_LIMITERS = [ACT_DIVE, ACT_WALL_KICK_AIR, ACT_PARACHUTING, ACT_GROUND_POUND, ACT_FREEFALL]

export const INPUT_NONZERO_ANALOG = 0x0001
export const INPUT_A_PRESSED = 0x0002
export const INPUT_OFF_FLOOR = 0x0004
export const INPUT_ABOVE_SLIDE = 0x0008
export const INPUT_FIRST_PERSON = 0x0010
export const INPUT_UNKNOWN_5 = 0x0020
export const INPUT_SQUISHED = 0x0040
export const INPUT_A_DOWN = 0x0080
export const INPUT_IN_POISON_GAS = 0x0100
export const INPUT_IN_WATER = 0x0200
export const INPUT_UNKNOWN_10 = 0x0400
export const INPUT_INTERACT_OBJ_GRABBABLE = 0x0800
export const INPUT_UNKNOWN_12 = 0x1000
export const INPUT_B_PRESSED = 0x2000
export const INPUT_Z_DOWN = 0x4000
export const INPUT_Z_PRESSED = 0x8000
export const INPUT_TAUNT = 0x10000
export const INPUT_PARACHUTE = 0x20000

export const GROUND_STEP_LEFT_GROUND = 0
export const GROUND_STEP_NONE = 1
export const GROUND_STEP_HIT_WALL = 2
export const GROUND_STEP_HIT_WALL_STOP_QSTEPS = 2
export const GROUND_STEP_HIT_WALL_CONTINUE_QSTEPS = 3

export const WATER_STEP_NONE        = 0
export const WATER_STEP_HIT_FLOOR   = 1
export const WATER_STEP_HIT_CEILING = 2
export const WATER_STEP_CANCELLED   = 3
export const WATER_STEP_HIT_WALL    = 4

export const sJumpLandAction = {
    numFrames: 4,
    unk02: 5,
    verySteepAction: ACT_FREEFALL,
    endAction: ACT_JUMP_LAND_STOP,
    aPressedAction: ACT_DOUBLE_JUMP,
    offFloorAction: ACT_FREEFALL,
    slideAction: ACT_BEGIN_SLIDING
}

export const sFreefallLandAction = {
    numFrames: 4,
    unk02: 5,
    verySteepAction: ACT_FREEFALL,
    endAction: ACT_FREEFALL_LAND_STOP,
    aPressedAction: ACT_DOUBLE_JUMP,
    offFloorAction: ACT_FREEFALL,
    slideAction: ACT_BEGIN_SLIDING
}

export const sSideFlipLandAction = {
    numFrames: 4,
    unk02: 5,
    verySteepAction: ACT_FREEFALL,
    endAction: ACT_SIDE_FLIP_LAND_STOP,
    aPressedAction: ACT_DOUBLE_JUMP,
    offFloorAction: ACT_FREEFALL,
    slideAction: ACT_BEGIN_SLIDING
}

export const sDoubleJumpLandAction = {
    numFrames: 4,
    unk02: 5,
    verySteepAction: ACT_FREEFALL,
    endAction: ACT_DOUBLE_JUMP_LAND_STOP,
    aPressedAction: ACT_JUMP,
    offFloorAction: ACT_FREEFALL,
    slideAction: ACT_BEGIN_SLIDING
}

export const sTripleJumpLandAction = {
    numFrames: 4,
    unk02: 0,
    verySteepAction: ACT_FREEFALL,
    endAction: ACT_TRIPLE_JUMP_LAND_STOP,
    aPressedAction: null,
    offFloorAction: ACT_FREEFALL,
    slideAction: ACT_BEGIN_SLIDING
}

export const sBackflipLandAction = {
    numFrames: 4,
    unk02: 0,
    verySteepAction: ACT_FREEFALL,
    endAction: ACT_BACKFLIP_LAND_STOP,
    aPressedAction: ACT_BACKFLIP,
    offFloorAction: ACT_FREEFALL,
    slideAction: ACT_BEGIN_SLIDING
}

export const sLongJumpLandAction = {
    numFrames: 6,
    unk02: 5,
    verySteepAction: ACT_FREEFALL,
    endAction: ACT_LONG_JUMP_LAND_STOP,
    aPressedAction: ACT_LONG_JUMP,
    offFloorAction: ACT_FREEFALL,
    slideAction: ACT_BEGIN_SLIDING
}

export const sForwardKnockbackActions = [
    [ACT_SOFT_FORWARD_GROUND_KB, ACT_FORWARD_GROUND_KB, ACT_HARD_FORWARD_GROUND_KB],
    [ACT_FORWARD_AIR_KB, ACT_FORWARD_AIR_KB, ACT_HARD_FORWARD_AIR_KB],
    [ACT_FORWARD_WATER_KB, ACT_FORWARD_WATER_KB, ACT_FORWARD_WATER_KB]
]

export const sBackwardKnockbackActions = [
    [ACT_SOFT_BACKWARD_GROUND_KB, ACT_BACKWARD_GROUND_KB, ACT_HARD_BACKWARD_GROUND_KB],
    [ACT_BACKWARD_AIR_KB, ACT_BACKWARD_AIR_KB, ACT_HARD_BACKWARD_AIR_KB],
    [ACT_BACKWARD_WATER_KB, ACT_BACKWARD_WATER_KB, ACT_BACKWARD_WATER_KB]
]

export const init_marios = () => {

    Object.assign(LevelUpdate.gMarioState, {
        actionTimer: 0,
        framesSinceA: 0xFF,
        framesSinceB: 0xFF,
        invincTimer: 0,
        flags: MARIO_CAP_ON_HEAD | MARIO_NORMAL_CAP,
        forwardVel: 0.0,
        squishTimer: 0,
        hurtCounter: 0,
        healCounter: 0,
        capTimer: 0,
		pvp: 1,
        quicksandDepth: 0.0,
        area: Area.gCurrentArea,
        marioObj: ObjectListProcessor.gMarioObject,
        faceAngle: [ ...Area.gMarioSpawnInfo.startAngle ],
        slideYaw: 0,
        angleVel: [0, 0, 0],
        pos: [ ...Area.gMarioSpawnInfo.startPos ],
        vel: [0, 0, 0, 0],
		canGlide: 0,
        action: Area.gMarioSpawnInfo.parachuteSpawn ? ACT_PARACHUTING : ACT_IDLE,
        controller: { stickX: 0, stickY: 0, stickMag: 0 }
    })

    Object.assign(LevelUpdate.gMarioState.marioObj.header.gfx, {
        unk38: {
            ...LevelUpdate.gMarioState.marioObj.header.gfx.unk38,
            animID: 0,
            animFrame: 0,
            animFrameAccelAssist: 0,
            animAccel: 0x10000,
            animTimer: 0
        }
    })

    LevelUpdate.gMarioState.marioObj.marioState = LevelUpdate.gMarioState
    socketGameData.marioState = LevelUpdate.gMarioState

}

export const set_forward_vel = (m, forwardVel) => {
    m.forwardVel = forwardVel

    m.slideVelX = m.forwardVel * Math.sin(m.faceAngle[1] / 0x8000 * Math.PI)
    m.slideVelZ = m.forwardVel * Math.cos(m.faceAngle[1] / 0x8000 * Math.PI)

    m.vel[0] = m.slideVelX
    m.vel[2] = m.slideVelZ
}

export const set_mario_y_vel_based_on_fspeed = (m, initialVelY, multiplier) => {
    m.vel[1] = initialVelY + (m.forwardVel * multiplier)
}

const read_next_anim_value = (curFrame, attribute, values) => {
    const index = retrieve_animation_index(curFrame, attribute)
    const value = values[index]
    return value > 32767 ? value - 65536 : value
}

export const find_mario_anim_flags_and_translation = (obj, yaw, translation) => {
    const curAnim = obj.header.gfx.unk38.curAnim
    const animFrame = geo_update_animation_frame(obj.header.gfx.unk38, null)
    const animValues = curAnim.values

    const attribute = { indexToIndices: 0, indices: curAnim.indices }

    const s = Math.sin(yaw / 0x8000 * Math.PI)
    const c = Math.cos(yaw / 0x8000 * Math.PI)

    const dx = read_next_anim_value(animFrame, attribute, animValues) / 4.0
    translation[1] = read_next_anim_value(animFrame, attribute, animValues) / 4.0
    const dz = read_next_anim_value(animFrame, attribute, animValues) / 4.0

    translation[0] = (dx * c) + (dz * s)
    translation[2] = (-dx * s) + (dz * c)

    return curAnim.flags

}

export const return_mario_anim_y_translation = (m) => {
    const translation = new Array(3)
    find_mario_anim_flags_and_translation(m.marioObj, 0, translation)
    return translation[1]
}

export const check_common_action_exits = (m) => {

    if (m.input & INPUT_A_PRESSED) {
        return set_mario_action(m, ACT_JUMP, 0)
    }

    if (m.input & INPUT_OFF_FLOOR) {
        return set_mario_action(m, ACT_FREEFALL, 0)
    }

    if (m.input & INPUT_NONZERO_ANALOG) {
        return set_mario_action(m, ACT_WALKING, 0)
    }
    if (m.input & INPUT_ABOVE_SLIDE) {
        return set_mario_action(m, ACT_BEGIN_SLIDING, 0);
    }

    return 0
}


export const drop_and_set_mario_action = (m, action, actionArg) => {
    //drop item
    return set_mario_action(m, action, actionArg)
}

export const set_jumping_action = (m, action, actionArg) => {

    if (mario_floor_is_steep(m)) {
        set_steep_jump_action(m)
    } else {
        set_mario_action(m, action, actionArg)
    }

    return 1
}

const set_steep_jump_action = (m) => {
    m.marioObj.rawData[oMarioSteepJumpYaw] = m.faceAngle[1]

    if (m.forwardVel > 0.0) {

        const angleTemp = int16(m.floorAngle + 0x8000)
        const faceAngleTemp = int16(m.faceAngle[1] - angleTemp)

        const y = sins(faceAngleTemp) * m.forwardVel
        const x = coss(faceAngleTemp) * m.forwardVel * 0.75

        m.forwardVel = Math.sqrt(y * y + x * x)
        m.faceAngle[1] = atan2s(x, y) + angleTemp
    }

    drop_and_set_mario_action(m, ACT_STEEP_JUMP, 0)
}

export const set_jump_from_landing = (m) => {

    if (mario_floor_is_steep(m)) {
        set_steep_jump_action(m)
    } else {
        if (m.doubleJumpTimer == 0) {
            set_mario_action(m, ACT_JUMP, 0)
        } else {
            switch (m.prevAction) {
                case ACT_JUMP_LAND: set_mario_action(m, ACT_DOUBLE_JUMP, 0); break
                case ACT_FREEFALL_LAND: set_mario_action(m, ACT_DOUBLE_JUMP, 0); break
                case ACT_SIDE_FLIP_LAND_STOP: set_mario_action(m, ACT_DOUBLE_JUMP, 0); break
                case ACT_DOUBLE_JUMP_LAND:
                    if (m.forwardVel > 20.0) set_mario_action(m, ACT_TRIPLE_JUMP, 0)
                    else set_mario_action(m, ACT_JUMP, 0)
                    break
                default: set_mario_action(m, ACT_JUMP, 0) // throw err "no floor"
            }
        }

    } 


    m.doubleJumpTimer = 0

    return 1
}

export const set_mario_action = (m, action, actionArg) => {

    switch (action & ACT_GROUP_MASK) {
        case ACT_GROUP_MOVING:
            action = set_mario_action_moving(m, action, actionArg); break
        case ACT_GROUP_AIRBORNE:
            action = set_mario_action_airborne(m, action, actionArg); break
    }

    m.flags &= ~(MARIO_ACTION_SOUND_PLAYED | MARIO_MARIO_SOUND_PLAYED)

    m.prevAction = m.action
    m.action = action
    m.actionArg = actionArg
    m.actionState = 0
    m.actionTimer = 0

    return 1
}

export const set_mario_action_airborne = (m, action, actionArg) => {
    switch (action) {
        case ACT_JUMP:
            m.marioObj.header.gfx.unk38.animID = -1
            set_mario_y_vel_based_on_fspeed(m, 42.0, 0.25)
            m.forwardVel *= 0.8
            break
        case ACT_SIDE_FLIP:
            set_mario_y_vel_based_on_fspeed(m, 62.0, 0.0)
            m.forwardVel = 8.0
            m.faceAngle[1] = m.intendedYaw
            break
        case ACT_STEEP_JUMP:
            m.marioObj.header.gfx.unk38.animID = -1
            set_mario_y_vel_based_on_fspeed(m, 42.0, 0.25)
            m.faceAngle[0] = -0x2000
            break
        case ACT_DOUBLE_JUMP:
            set_mario_y_vel_based_on_fspeed(m, 52.0, 0.25)
            m.forwardVel *= 0.8
            break
        case ACT_TRIPLE_JUMP:
            set_mario_y_vel_based_on_fspeed(m, 69.0, 0.0)
            m.forwardVel *= 0.8
            break
        case ACT_WALL_KICK_AIR:
        case ACT_TOP_OF_POLE_JUMP:
            set_mario_y_vel_based_on_fspeed(m, 62.0, 0.0)
            if (m.forwardVel < 24.0) m.forwardVel = 24.0
            m.wallKickTimer = 0
            break
        case ACT_BACKFLIP:
            m.marioObj.header.gfx.unk38.animID = -1
            m.forwardVel = -16.0
            set_mario_y_vel_based_on_fspeed(m, 62.0, 0.0)
            break
        case ACT_LONG_JUMP:
            m.marioObj.header.gfx.unk38.animID = -1
            set_mario_y_vel_based_on_fspeed(m, 30.0, 0.0)
            m.marioObj.oMarioLongJumpIsSlow = m.forwardVel > 16.0 ? false : true
 
            //! (BLJ's) This properly handles long jumps from getting forward speed with
            //  too much velocity, but misses backwards longs allowing high negative speeds.
            if ((m.forwardVel *= 1.5) > 48.0) {
                m.forwardVel = 48.0
            }
            break
        case ACT_JUMP_KICK:
            m.vel[1] = 20.0
            break
        case ACT_DIVE:
            let forwardVel = m.forwardVel + 15.0
            if (forwardVel > 48.0) {
                forwardVel = 48.0
            }
            set_forward_vel(m, forwardVel)
            break
        case ACT_SLIDE_KICK:
            m.vel[1] = 12.0
            if (m.forwardVel < 32.0) {
                m.forwardVel = 32.0
            }
            break
    }

    m.peakHeight = m.pos[1]
    m.flags |= MARIO_UNKNOWN_08

    return action
}

export const set_mario_action_moving = (m, action, actionArg) => {
    const floorClass = mario_get_floor_class(m)
    const forwardVel = m.forwardVel
    const mag = Math.min(m.intendedMag, 8.0)

    switch (action) {
        case ACT_WALKING:
            if (floorClass != SurfaceTerrains.SURFACE_CLASS_VERY_SLIPPERY) {
                if (0.0 <= forwardVel && forwardVel < mag) {
                    m.forwardVel = mag
                }
            }

            m.marioObj.rawData[oMarioWalkingPitch] = 0
            break
        case ACT_BEGIN_SLIDING:
            if (mario_facing_downhill(m, false)) {
                action = ACT_BUTT_SLIDE;
            } else {
                action = ACT_STOMACH_SLIDE;
            }
            break;
    }

    return action
}

export const set_mario_animation = (m, targetAnimID, reset) => {

    const o = m.marioObj
    m.animation.targetAnim = gMarioAnimData[targetAnimID]

    if (m.animation.targetAnim == undefined) throw "cant find animation"


    if (o.header.gfx.unk38.animID != targetAnimID || reset) {
        o.header.gfx.unk38.animID = targetAnimID
        o.header.gfx.unk38.curAnim = m.animation.targetAnim
        o.header.gfx.unk38.animAccel = 0
        o.header.gfx.unk38.animYTrans = m.unkB0

        if (m.animation.targetAnim.flags & ANIM_FLAG_2) {
            o.header.gfx.unk38.animFrame = m.animation.targetAnim.unk04
        } else {
            if (m.animation.targetAnim.flags & ANIM_FLAG_FORWARD) {
                o.header.gfx.unk38.animFrame = m.animation.targetAnim.unk04 + 1
            } else {
                o.header.gfx.unk38.animFrame = m.animation.targetAnim.unk04 - 1
            }
        }
    }
    return o.header.gfx.unk38.animFrame

}

export const set_mario_anim_with_accel = (m, targetAnimID, accel) => {

    const o = m.marioObj
    m.animation.targetAnim = gMarioAnimData[targetAnimID]

    if (o.header.gfx.unk38.animID != targetAnimID) {
        o.header.gfx.unk38.animID = targetAnimID
        o.header.gfx.unk38.curAnim = m.animation.targetAnim
        o.header.gfx.unk38.animYTrans = m.unkB0

        if (m.animation.targetAnim.flags & ANIM_FLAG_2) {
            o.header.gfx.unk38.animFrameAccelAssist = (m.animation.targetAnim << 0x10)
        } else {
            if (m.animation.targetAnim.flags & ANIM_FLAG_FORWARD) {
                o.header.gfx.unk38.animFrameAccelAssist = (m.animation.targetAnim << 0x10) + accel
            } else {
                o.header.gfx.unk38.animFrameAccelAssist = (m.animation.targetAnim << 0x10) - accel
            }
        }

        o.header.gfx.unk38.animFrame = (o.header.gfx.unk38.animFrameAccelAssist >> 0x10)
    }

    o.header.gfx.unk38.animAccel = accel

    return o.header.gfx.unk38.animFrame

}

export const set_anim_to_frame = (m, animFrame) => {
    const animInfo = m.marioObj.header.gfx.unk38;
    const curAnim = animInfo.curAnim;

    if (animInfo.animAccel) {
        if (curAnim.flags & ANIM_FLAG_FORWARD) {
            animInfo.animFrameAccelAssist = (animFrame << 0x10) + animInfo.animAccel;
        } else {
            animInfo.animFrameAccelAssist = (animFrame << 0x10) - animInfo.animAccel;
        }
    } else {
        if (curAnim.flags & ANIM_FLAG_FORWARD) {
            animInfo.animFrame = animFrame + 1;
        } else {
            animInfo.animFrame = animFrame - 1;
        }
    }
}

export const is_anim_at_end = (m) => {
    const o = m.marioObj //TODO fix unk38 as animInfo
    return (o.header.gfx.unk38.animFrame + 1) == o.header.gfx.unk38.curAnim.unk08
}

export const is_anim_past_end = (m) => {
    const o = m.marioObj
    return o.header.gfx.unk38.animFrame >= (o.header.gfx.unk38.curAnim.unk08 - 2)
}

export const is_anim_past_frame = (m, animFrame) => {
    let isPastFrame
    const acceleratedFrame = animFrame << 0x10
    const animInfo = m.marioObj.header.gfx.unk38
    const curAnim = animInfo.curAnim

    if (animInfo.animAccel) {
        if (curAnim.flags & ANIM_FLAG_FORWARD) {
            isPastFrame =
                (animInfo.animFrameAccelAssist > acceleratedFrame)
                && (acceleratedFrame >= (animInfo.animFrameAccelAssist - animInfo.animAccel))
        } else {
            isPastFrame =
                (animInfo.animFrameAccelAssist < acceleratedFrame)
                && (acceleratedFrame <= (animInfo.animFrameAccelAssist + animInfo.animAccel))
        }
    } else {
        if (curAnim.flags & ANIM_FLAG_FORWARD) {
            isPastFrame = (animInfo.animFrame == (animFrame + 1))
        } else {
            isPastFrame = ((animInfo.animFrame + 1) == animFrame)
        }
    }

    return isPastFrame
}

const mario_reset_bodystate = (m) => {
    const bodyState = m.marioBodyState

    bodyState.capState = 1
    bodyState.eyeState = 0
    bodyState.handState = 0
    bodyState.modelState = 0
    bodyState.wingFlutter = false

    m.flags &= ~MARIO_METAL_SHOCK
}

export const execute_mario_action = (m) => {
    if (m.action) {

        m.marioObj.header.gfx.node.flags &= ~GRAPH_RENDER_INVISIBLE
        mario_reset_bodystate(m)
        update_mario_inputs(m)
        Interact.mario_handle_special_floors(m)
        Interact.mario_process_interactions(m)

        let inLoop = 1

        while (inLoop) {
            switch (m.action & ACT_GROUP_MASK) {
                case ACT_GROUP_STATIONARY:
                    inLoop = mario_execute_stationary_action(m); break

                case ACT_GROUP_MOVING:
                    inLoop = mario_execute_moving_action(m); break

                case ACT_GROUP_AIRBORNE:
                    inLoop = mario_execute_airborne_action(m); break

                case ACT_GROUP_OBJECT:
                    inLoop = mario_execute_object_action(m); break

                case ACT_GROUP_AUTOMATIC:
                    inLoop = mario_execute_automatic_action(m); break

                case ACT_GROUP_CUTSCENE:
                    inLoop = mario_execute_cutscene_action(m); break

                case ACT_GROUP_SUBMERGED:
                    inLoop = mario_execute_submerged_action(m); break

                default: throw "unkown action group"
            }
        }


        set_submerged_cam_preset_and_spawn_bubbles(m)
        update_mario_health(m)
        update_mario_info_for_cam(m)
        mario_update_hitbox_and_cap_model(m)

        m.marioObj.rawData[oInteractStatus] = 0

        return m.particleFlags
    }
}


const mario_update_hitbox_and_cap_model = (m) => {

    const bodyState = m.marioBodyState
    const flags = 0 // TODO update_and_return_cap_flags(m)

    if (flags & MARIO_VANISH_CAP) {
        bodyState.modelState = MarioConstants.MODEL_STATE_NOISE_ALPHA
    }

    if (flags & MARIO_METAL_CAP) {
        bodyState.modelState |= MarioConstants.MODEL_STATE_METAL
    }

    if (flags & MARIO_METAL_SHOCK) {
        bodyState.modelState |= MarioConstants.MODEL_STATE_METAL
    }

    if (m.invincTimer >= 3) {
        //! (Pause buffered hitstun) Since the global timer increments while paused,
        //  this can be paused through to give continual invisibility. This leads to
        //  no interaction with objects.

        if (window.gGlobalTimer & 1) {
            m.marioObj.header.gfx.node.flags |= GRAPH_RENDER_INVISIBLE
        }
    }

    if (flags & MARIO_CAP_IN_HAND) {
        throw "todo (flags & MARIO_CAP_IN_HAND)"
        if (flags & MARIO_WING_CAP) {
            bodyState.handState = MARIO_HAND_HOLDING_WING_CAP
        } else {
            bodyState.handState = MARIO_HAND_HOLDING_CAP
        }
    }

    if (flags & MARIO_CAP_ON_HEAD) {
        throw "todo (flags & MARIO_CAP_ON_HEAD)"
        if (flags & MARIO_WING_CAP) {
            bodyState.capState = MARIO_HAS_WING_CAP_ON
        } else {
            bodyState.capState = MARIO_HAS_DEFAULT_CAP_ON
        }
    }

    // Short hitbox for crouching/crawling/etc.
    if (m.action & ACT_FLAG_SHORT_HITBOX) {
        m.marioObj.hitboxHeight = 100.0
    } else {
        m.marioObj.hitboxHeight = 160.0
    }

    if ((m.flags & MARIO_TELEPORTING) && (m.fadeWarpOpacity != 0xFF)) {
        bodyState.modelState &= ~0xFF
        bodyState.modelState |= (0x100 | m.fadeWarpOpacity)
    }

}

const update_mario_health = (m) => {
	if (m.marioObj.localMario) {
		window.myMario.readOnlyHealth = m.health > 0 ? m.health >> 8 : 0
	}


    if (m.health >= 0x100) {

        // When already healing or hurting Mario, Mario's HP is not changed any more here.
        if ((m.healCounter | m.hurtCounter) == 0) {
            if ((m.input & INPUT_IN_POISON_GAS) && ((m.action & ACT_FLAG_INTANGIBLE) == 0)) {
                if (((m.flags & MARIO_METAL_CAP) == 0)) {
                    m.health -= 4
                }
            } else {
                if ((m.action & ACT_FLAG_SWIMMING) && ((m.action & ACT_FLAG_INTANGIBLE) == 0)) {
                    const terrainIsSnow = (m.area.terrainType & SurfaceTerrains.TERRAIN_MASK) == SurfaceTerrains.TERRAIN_SNOW

                    // When Mario is near the water surface, recover health (unless in snow),
                    // when in snow terrains lose 3 health.
                    // If using the debug level select, do not lose any HP to water.
                    if ((m.pos[1] >= (m.waterLevel - 140)) && !terrainIsSnow) {
                        m.health += 0x1A
                    } else  {
                        m.health -= (terrainIsSnow ? 3 : 1)
                    }
                }
            }
        }


        if (m.healCounter > 0) {
            m.health += 0x40
            m.healCounter--
        }
        if (m.hurtCounter > 0) {
            m.health -= 0x40
            m.hurtCounter--
        }

        if (m.health >= 0x881) {
            m.health = 0x880
        }
        if (m.health < 0x100) {
            m.health = 0xFF
        }


        // TODO // Play a noise to alert the player when Mario is close to drowning.

    }
}

const update_mario_button_inputs = (m) => {

    if (m.controller == null) return

    if (m.controller.buttonPressedA) m.input |= INPUT_A_PRESSED
    if (m.controller.buttonDownA) m.input |= INPUT_A_DOWN
    if (m.controller.buttonPressedB) m.input |= INPUT_B_PRESSED
    if (m.controller.buttonPressedZ) m.input |=  INPUT_Z_PRESSED
    if (m.controller.buttonDownZ) m.input |=  INPUT_Z_DOWN
}

const update_mario_joystick_inputs = (m) => {

    if (m.controller == null) return

    const mag = m.controller.stickMag

    m.intendedMag = mag / 2.0 

    if (m.intendedMag > 0.0) {
        if (m.marioObj.remoteMario) {
            m.intendedYaw = atan2s(-m.controller.stickY, m.controller.stickX) + m.controller.cameraYaw
        } else if (m.marioObj.localMario) {
            m.intendedYaw = atan2s(-m.controller.stickY, m.controller.stickX) + m.area.camera.yaw
        } else throw "mario state must either be local or remote"
        m.input |= INPUT_NONZERO_ANALOG
    } else {
        m.intendedYaw = m.faceAngle[1]
    }

    m.intendedYaw = m.intendedYaw > 32767 ? m.intendedYaw - 65536 : m.intendedYaw
    m.intendedYaw = m.intendedYaw < -32768 ? m.intendedYaw + 65536 : m.intendedYaw
}

const update_mario_geometry_inputs = (m) => {

    m.old_floor = m.floor
    m.old_height = m.floorHeight

    m.floorHeight = SurfaceCollision.find_floor(m.pos[0], m.pos[1], m.pos[2], m)

    if (!m.floor) {
        m.pos = [ ...m.marioObj.header.gfx.pos ]
        m.floorHeight = SurfaceCollision.find_floor(m.pos[0], m.pos[1], m.pos[2], m)
    }

    m.ceilHeight = vec3_find_ceil(m.pos, m.floorHeight, m)
    m.waterLevel = SurfaceCollision.find_water_level(m.pos[0], m.pos[2])

    if (!m.floor) { /// still no floor - short term fix?
        m.floor = m.old_floor
        m.floorHeight = m.old_height
    }

    if (m.floor) {
        if (!m.floor.normal) throw "normal missing"
        m.floorAngle = atan2s(m.floor.normal.z, m.floor.normal.x)

        if ((m.pos[1] > m.waterLevel - 40) && mario_floor_is_slippery(m)) {
            m.input |= INPUT_ABOVE_SLIDE
        }

        if ((m.floor.flags & SurfaceTerrains.SURFACE_FLAG_DYNAMIC)
            || (m.ceil && m.ceil.flags & SurfaceTerrains.SURFACE_FLAG_DYNAMIC)) {
            let ceilToFloorDist = m.ceilHeight - m.floorHeight;

            if ((0.0 <= ceilToFloorDist) && (ceilToFloorDist <= 150.0)) {
                m.input |= INPUT_SQUISHED
            }
        }

        if (m.pos[1] > m.floorHeight + 100.0) {
            m.input |= INPUT_OFF_FLOOR;
        }

        if (m.pos[1] < (m.waterLevel - 10)) {
            m.input |= INPUT_IN_WATER
        }

    } else {
        m.input |= INPUT_OFF_FLOOR;
    }

    /// bouncepad
    if (m.floor.type == 0x0004 && !(m.input & INPUT_OFF_FLOOR && m.health > 0xFF)) {
        m.vel[1] = 200
        set_mario_action(m, ACT_PARACHUTING, 0)
    }

}

export const mario_floor_is_slippery = (m) => {
    let normY

    if ((m.area.terrainType & SurfaceTerrains.TERRAIN_MASK) == SurfaceTerrains.TERRAIN_SLIDE
        && m.floor.normal.y < 0.9998477 //~cos(1 deg)
    ) {
        return true
    }

    switch (mario_get_floor_class(m)) {
        case SurfaceTerrains.SURFACE_VERY_SLIPPERY:
            normY = 0.9848077 //~cos(10 deg)
            break

        case SurfaceTerrains.SURFACE_SLIPPERY:
            normY = 0.9396926 //~cos(20 deg)
            break

        default:
            normY = 0.7880108 //~cos(38 deg)
            break

        case SurfaceTerrains.SURFACE_NOT_SLIPPERY:
            normY = 0.0
            break
    }

    return m.floor.normal.y <= normY
}

export const mario_floor_is_slope = (m) => {
    let normY

    if ((m.area.terrainType & SurfaceTerrains.TERRAIN_MASK) == SurfaceTerrains.TERRAIN_SLIDE
        && m.floor.normal.y < 0.9998477 //~cos(1 deg)
    ) {
        return true
    }

    switch (mario_get_floor_class(m)) {
        case SurfaceTerrains.SURFACE_VERY_SLIPPERY:
            normY = 0.9961947 //~cos(10 deg)
            break

        case SurfaceTerrains.SURFACE_SLIPPERY:
            normY = 0.9848077 //~cos(20 deg)
            break

        default:
            normY = 0.9659258 //~cos(38 deg)
            break

        case SurfaceTerrains.SURFACE_NOT_SLIPPERY:
            normY = 0.9396926
            break
    }

    return m.floor.normal.y <= normY
}

export const mario_floor_is_steep = (m) => {
    let normY

    let result = false

    if (!mario_facing_downhill(m, false)) {
        switch (mario_get_floor_class(m)) {
            case SurfaceTerrains.SURFACE_VERY_SLIPPERY:
                normY = 0.9659258 //~cos(15 deg)
                break

            case SurfaceTerrains.SURFACE_SLIPPERY:
                normY = 0.9396926 //~cos(20 deg)
                break

            default:
                normY = 0.8660254 //~cos(30 deg)
                break

            case SurfaceTerrains.SURFACE_NOT_SLIPPERY:
                normY = 0.8660254 //~cos(30 deg)
                break
        }

        result = m.floor.normal.y <= normY

    }

    return result
}

export const mario_get_floor_class = (m) => {
    let floorClass

    // The slide terrain type defaults to slide slipperiness.
    // This doesn't matter too much since normally the slide terrain
    // is checked for anyways.
    if ((m.area.terrainType & SurfaceTerrains.TERRAIN_MASK) == SurfaceTerrains.TERRAIN_SLIDE) {
        floorClass = SurfaceTerrains.SURFACE_CLASS_VERY_SLIPPERY
    } else {
        floorClass = SurfaceTerrains.SURFACE_CLASS_DEFAULT
    }

    if (m.floor) {
        switch (m.floor.type) {
            case SurfaceTerrains.SURFACE_NOT_SLIPPERY:
            case SurfaceTerrains.SURFACE_HARD_NOT_SLIPPERY:
            case SurfaceTerrains.SURFACE_SWITCH:
                floorClass = SurfaceTerrains.SURFACE_CLASS_NOT_SLIPPERY
                break

            case SurfaceTerrains.SURFACE_SLIPPERY:
            case SurfaceTerrains.SURFACE_NOISE_SLIPPERY:
            case SurfaceTerrains.SURFACE_HARD_SLIPPERY:
            case SurfaceTerrains.SURFACE_NO_CAM_COL_SLIPPERY:
                floorClass = SurfaceTerrains.SURFACE_CLASS_SLIPPERY
                break

            case SurfaceTerrains.SURFACE_VERY_SLIPPERY:
            case SurfaceTerrains.SURFACE_ICE:
            case SurfaceTerrains.SURFACE_HARD_VERY_SLIPPERY:
            case SurfaceTerrains.SURFACE_NOISE_VERY_SLIPPERY_73:
            case SurfaceTerrains.SURFACE_NOISE_VERY_SLIPPERY_74:
            case SurfaceTerrains.SURFACE_NOISE_VERY_SLIPPERY:
            case SurfaceTerrains.SURFACE_NO_CAM_COL_VERY_SLIPPERY:
                floorClass = SurfaceTerrains.SURFACE_CLASS_VERY_SLIPPERY
                break
        }
    }

    // Crawling allows Mario to not slide on certain steeper surfaces.
    if (m.action == ACT_CRAWLING && m.floor.normal.y > 0.5 && floorClass == SurfaceTerrains.SURFACE_CLASS_DEFAULT) {
        floorClass = SurfaceTerrains.SURFACE_CLASS_NOT_SLIPPERY
    }

    return floorClass
}

export const vec3_find_ceil = (pos, height, ceil) => {
    return SurfaceCollision.find_ceil(pos[0], height + 80.0, pos[2], ceil)
}

export const mario_facing_downhill = (m, turnYaw) => {
    let faceAngleYaw = m.faceAngle[1];

    // This is never used in practice, as turnYaw is
    // always passed as zero.
    if (turnYaw && m.forwardVel < 0.0) {
        faceAngleYaw += 0x8000;
    }

    faceAngleYaw = m.floorAngle - faceAngleYaw;
    faceAngleYaw = faceAngleYaw > 32767 ? faceAngleYaw - 65536 : faceAngleYaw;
    faceAngleYaw = faceAngleYaw < -32768 ? faceAngleYaw + 65536 : faceAngleYaw;

    return (-0x4000 < faceAngleYaw) && (faceAngleYaw < 0x4000);
}

export const find_floor_height_relative_polar = (m, angleFromMario, distFromMario) => {

    const y = Math.sin((m.faceAngle[1] + angleFromMario) / 0x8000 * Math.PI) * distFromMario
    const x = Math.cos((m.faceAngle[1] + angleFromMario) / 0x8000 * Math.PI) * distFromMario

    return SurfaceCollision.find_floor(m.pos[0] + y, m.pos[1] + 100.0, m.pos[2] + x, {})
}

export const find_floor_slope = (m, yawOffset) => {
    const floor = {};
    let forwardFloorY, backwardFloorY
    let forwardYDelta, backwardYDelta;
    let result;

    let x = Math.sin((m.faceAngle[1] + yawOffset) / 0x8000 * Math.PI) * 5.0;
    let z = Math.cos((m.faceAngle[1] + yawOffset) / 0x8000 * Math.PI) * 5.0;

    forwardFloorY = SurfaceCollision.find_floor(m.pos[0] + x, m.pos[1] + 100.0, m.pos[2] + z, floor);
    backwardFloorY = SurfaceCollision.find_floor(m.pos[0] - x, m.pos[1] + 100.0, m.pos[2] - z, floor);

    //! If Mario is near OOB, these floorY's can sometimes be -11000.
    //  This will cause these to be off and give improper slopes.
    forwardYDelta = forwardFloorY - m.pos[1];
    backwardYDelta = m.pos[1] - backwardFloorY;

    if (forwardYDelta * forwardYDelta < backwardYDelta * backwardYDelta) {
        result = atan2s(5.0, forwardYDelta);
    } else {
        result = atan2s(5.0, backwardYDelta);
    }

    return result;
}

export const resolve_and_return_wall_collisions = (pos, offset, radius) => {
    const collisionData = {
        radius,
        offsetY: offset,
        x: pos[0], y: pos[1], z: pos[2],
        walls: []
    }

    let wall

    if (SurfaceCollision.find_wall_collisions(collisionData)) {
        wall = collisionData.walls[collisionData.numWalls - 1]
    }

    pos[0] = collisionData.x
    pos[1] = collisionData.y
    pos[2] = collisionData.z

    return wall
}

const update_mario_inputs = (m) => {
    m.particleFlags = 0
    m.input = 0
    m.collidedObjInteractTypes = m.marioObj.collidedObjInteractTypes
    m.flags &= 0xFFFFFF
    update_mario_joystick_inputs(m)
    update_mario_button_inputs(m) 
    update_mario_geometry_inputs(m)
	if (window.reset) {respawn_player(m)}
    if (m.controller.taunt && (m.action == ACT_IDLE || m.action == ACT_TAUNT)) m.input |= INPUT_TAUNT
    if (m.controller.parachute && ((m.vel[1] < 0.0) || ([ACT_IDLE, ACT_KARTING, ACT_WALKING].includes(m.action) && Math.abs(m.forwardVel) < 16))) m.input |= INPUT_PARACHUTE
	
	m.canGlide = (PARACHUTE_LIMITERS.includes(m.action) ? m.canGlide : -1);
	
    if (Camera.gCameraMovementFlags & Camera.CAM_MOVE_C_UP_MODE) {
        if (m.action & ACT_FLAG_ALLOW_FIRST_PERSON) {
            m.input |= INPUT_FIRST_PERSON;
        } else {
            Camera.gCameraMovementFlags &= ~Camera.CAM_MOVE_C_UP_MODE;
        }
    }

    if (!(m.input & (INPUT_NONZERO_ANALOG | INPUT_A_PRESSED))) {
        m.input |= INPUT_UNKNOWN_5;
    }

    if (m.marioObj.rawData[oInteractStatus]
        & (Interact.INT_STATUS_HOOT_GRABBED_BY_MARIO | Interact.INT_STATUS_MARIO_UNK1 | Interact.INT_STATUS_MARIO_UNK4)) {
        m.input |= INPUT_UNKNOWN_10
    }

    if (m.wallKickTimer > 0) {
        m.wallKickTimer--
    }

    if (m.doubleJumpTimer > 0) {
        m.doubleJumpTimer--
    }
}

const update_mario_info_for_cam = (m) => {
    m.marioBodyState.action = m.action
    m.statusForCamera.action = m.action

    m.statusForCamera.faceAngle = [...m.faceAngle]

    if ((m.flags & MARIO_UNKNOWN_25) == 0) {
        m.statusForCamera.pos = [...m.pos]
    }
}

const set_submerged_cam_preset_and_spawn_bubbles = (m) => {

    if ((m.action & ACT_GROUP_MASK) == ACT_GROUP_SUBMERGED) {
        const heightBelowWater = (m.waterLevel - 80) - m.pos[1]
        const camPreset = m.area.camera.mode

        if (m.action & ACT_FLAG_METAL_WATER) {
            throw "Todo ACT_FLAG_METAL_WATER - set_submerged_cam_preset_and_spawn_bubbles"
        } else {

            //// TODO set submerged camera modes  CAMERA_MODE_BEHIND_MARIO, CAMERA_MODE_WATER_SURFACE

            // As long as Mario isn't drowning or at the top
            // of the water with his head out, spawn bubbles.
            if ((m.action & ACT_FLAG_INTANGIBLE) == 0) {
                if ((m.pos[1] < (m.waterLevel - 160)) || (m.faceAngle[0] < -0x800)) {
                    m.particleFlags |= MarioConstants.PARTICLE_BUBBLE
                }
            }
        }
    }

}

export const init_mario_from_save_file = () => {

    Object.assign(LevelUpdate.gMarioState, {
        unk00: 0, flags: 0, action: 0,
        spawnInfo: Area.gMarioSpawnInfo,
        statusForCamera: Camera.gPlayerCameraState,
        marioBodyState: MarioMisc.gBodyState,
        animation: { targetAnim: null },
        numCoins: 0, numStars: 0, numKeys: 0,
        numLives: 4, health: 0x880,
        unkB8: 0, unkB0: 0xBD
    })

    LevelUpdate.gHudDisplay.coins = 0;
    LevelUpdate.gHudDisplay.wedges = 8;
}

export const set_water_plunge_action = m => {
  m.forwardVel = m.forwardVel / 4
  m.vel[1] = m.vel[1] / 2

  m.pos[1] = m.waterLevel - 100

  m.faceAngle[2] = 0

  vec3s_set(m.angleVel, 0, 0, 0)

  if (!(m.action && ACT_FLAG_DIVING)) {
    m.faceAngle[0] = 0
  }

  //TODO implement camera

  return set_mario_action(m, ACT_WATER_PLUNGE, 0)
}

export const transition_submerged_to_walking = m => {
    // TODO set_camera_mode(m.area.camera, m.area.camera.defMode, 1);

    m.angleVel = [0, 0, 0];

    if (m.heldObj == null) {
        return set_mario_action(m, ACT_WALKING, 0);
    } else {
        return set_mario_action(m, ACT_HOLD_WALKING, 0);
    }
}

export const respawn_player = (m) => {
        set_mario_action(m, ACT_FREEFALL, 0)
        m.pos = [...Area.gMarioSpawnInfo.startPos]
        m.angle = [...Area.gMarioSpawnInfo.startAngle]
        m.vel = [0, 0, 0]
        m.forwardVel = 0
		m.health = 0x880
		m.healCounter = 1
		m.hurtCounter = 1
        m.invincTimer = 60
}
