import * as twgl from 'twgl.js'

const icon = "data:image/svg+xml,%3Csvg%20width%3D%22129%22%20height%3D%22129%22%20viewBox%3D%220%200%20129%20129%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M75%2067.1928H80V80.1928H75V67.1928Z%22%20fill%3D%22%239EE7F1%22%2F%3E%3Cpath%20d%3D%22M55.0731%2021.02L70.7722%2030.8701L60.6256%20108.129L43.464%20109.415L55.0731%2021.02Z%22%20fill%3D%22%239EE7F1%22%2F%3E%3Cpath%20d%3D%22M106.059%2046.3074L92.7209%2055.4334L53.5113%2034.7133L54.8128%2021.0354L106.059%2046.3074Z%22%20fill%3D%22%239EE7F1%22%2F%3E%3Cpath%20d%3D%22M102.549%2072.9834L89.2109%2079.3015L50.3659%2061.3893L51.6674%2047.7114L102.549%2072.9834Z%22%20fill%3D%22%239EE7F1%22%2F%3E%3Cpath%20d%3D%22M55.0731%2014L70.7722%2023.8501L60.6256%20101.109L43.464%20102.395L55.0731%2014Z%22%20fill%3D%22%23F19ED2%22%2F%3E%3Cpath%20d%3D%22M106.059%2039.2874L92.7209%2048.4134L53.5113%2027.6933L54.8128%2014.0154L106.059%2039.2874Z%22%20fill%3D%22%23F19ED2%22%2F%3E%3Cpath%20d%3D%22M102.549%2065.9634L89.2109%2072.2814L50.3659%2054.3693L51.6674%2040.6914L102.549%2065.9634Z%22%20fill%3D%22%23F19ED2%22%2F%3E%3Cpath%20d%3D%22M55.0731%2018.212L70.7722%2028.0621L60.6256%20105.321L43.464%20106.607L55.0731%2018.212Z%22%20fill%3D%22white%22%2F%3E%3Cpath%20d%3D%22M106.059%2043.4994L92.7209%2052.6254L53.5113%2031.9053L54.8128%2018.2274L106.059%2043.4994Z%22%20fill%3D%22white%22%2F%3E%3Cpath%20d%3D%22M102.549%2070.1754L89.2109%2076.4935L50.3659%2058.5813L51.6674%2044.9034L102.549%2070.1754Z%22%20fill%3D%22white%22%2F%3E%3Cpath%20d%3D%22M92%2070.1928H97V97.1928H92V70.1928Z%22%20fill%3D%22%23F1DF9E%22%2F%3E%3Cpath%20d%3D%22M69%2014.1928H72V29.1928H69V14.1928Z%22%20fill%3D%22%23F1DF9E%22%2F%3E%3Cpath%20d%3D%22M21%2018.1928H29V52.1928H21V18.1928Z%22%20fill%3D%22%23F1DF9E%22%2F%3E%3Cpath%20d%3D%22M37%2097.1928H47V115.193H37V97.1928Z%22%20fill%3D%22%23F19ED2%22%2F%3E%3Cpath%20d%3D%22M90%2018.1928H100V39.1928H90V18.1928Z%22%20fill%3D%22%23F19ED2%22%2F%3E%3Cpath%20d%3D%22M42%2039.1928H53V64.1928H42V39.1928Z%22%20fill%3D%22%239EE7F1%22%2F%3E%3C%2Fsvg%3E"
const extensionId = "quakeFrag"

const IS_SHADERED = "isQuakeFragmentShadered"
const PATCHES_ID = "__patches_quakefragment";
const patch = (obj, functions) => {
  if (obj[PATCHES_ID]) return;
  obj[PATCHES_ID] = {};
  for (const name in functions) {
    const original = obj[name];
    obj[PATCHES_ID][name] = obj[name];
    if (original) {
      obj[name] = function(...args) {
        const callOriginal = (...ogArgs) => original.call(this, ...ogArgs);
        return functions[name].call(this, callOriginal, ...args);
      };
    } else {
      obj[name] = function (...args) {
        return functions[name].call(this, () => {}, ...args);
      }
    }
  }
}
const unpatch = (obj) => {
  if (!obj[PATCHES_ID]) return;
  for (const name in obj[PATCHES_ID]) {
    obj[name] = obj[PATCHES_ID][name];
  }
  delete obj[PATCHES_ID];
}

var vertexShaderSource = `#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec2 position;
out vec2 fragUV;

// Used to pass in the resolution of the canvas
uniform vec2 u_resolution;

// all shaders have a main function
void main() {
  gl_Position = vec4(position, 0, 1);
  fragUV = (position / 2.0) + vec2(0.5, 0.5);
}
    `

var fragmentShaderSource = `#version 300 es

    // fragment shaders don't have a default precision so we need
    // to pick one. highp is a good default. It means "high precision"
    precision highp float;
    in vec2 fragUV;

    uniform vec4 u_color;
    uniform sampler2D u_skin;

    // we need to declare an output for the fragment shader
    out vec4 outColor;

    void main() {
      outColor = texture(u_skin, fragUV) * u_color;
    }
    `

/*
 * By: Xeltalliv
 * Link: https://github.com/Xeltalliv/extensions/blob/webgl2-dev/extensions/webgl2.js
 *
 * Modified by: Fath11
 * Link: https://github.com/fath11
 *
 * Please keep this comment if you wanna use this code :3
 */
class Skins {
  constructor(runtime) {
    this.runtime = runtime
    const Skin = this.runtime.renderer.exports.Skin

    class SimpleSkin extends Skin {
      constructor(id, renderer) {
        super(id, renderer)
        this.gl = renderer.gl
        const texture = this.gl.createTexture()
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST)
        //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0,255,0,255]));
        this._texture = texture
        this._rotationCenter = [320, 180]
        this._size = [640, 360]
      }
      dispose() {
        if (this._texture) {
          this.renderer.gl.deleteTexture(this._texture)
          this._texture = null
        }
        super.dispose()
      }
      set size(value) {
        this._size = value
        this._rotationCenter = [value[0] / 2, value[1] / 2]
      }
      get size() {
        return this._size
      }
      getTexture(scale) {
        return this._texture || super.getTexture()
      }
      setContent(textureData) {
        this.gl.bindTexture(this.gl.TEXTURE_2D, this._texture)
        this.gl.texImage2D(
          this.gl.TEXTURE_2D,
          0,
          this.gl.RGBA,
          this.gl.RGBA,
          this.gl.UNSIGNED_BYTE,
          textureData,
        )
        this._silhouette.update(textureData)
        this.emit(Skin.Events.WasAltered)
      }
    }

    this.SimpleSkin = SimpleSkin
  }
}
//End of Skins, Please keep this comment if you wanna use this code :3

class QuakeFragment {
  constructor(runtime) {
    window.TEST = this

    this.runtime = runtime
    this.shaderedSprites = []

    this.initFormatMessage({
      extensionName: ["地震碎片", "Quake Fragmment"],
      me: ["我", "me"],
    })
  }
  initFormatMessage(l10n) {
    const res = { "zh-cn": {}, en: {} }
    Object.entries(l10n).forEach(([id, msgs]) => {
      const ID = `${extensionId}.${id}`;
      [res["zh-cn"][ID], res.en[ID]] = msgs
    })
    const _formatMessage = this.runtime.getFormatMessage(res)
    this.fm = (id) => {
      const ID = `${extensionId}.${id}`
      return _formatMessage({
        ID,
        default: ID,
        description: ID,
      })
    }
  }
  getInfo() {
    return {
      id: "quakefrag",
      name: "Quake Fragment",
      color1: "#6645F6",
      color2: "#5237c5",
      color3: "#6645F6",
      blockIconURI: icon,
      menuIconURI: icon,
      blocks: [
        {
          opcode: "applyShader",
          blockType: Scratch.BlockType.COMMAND,
          text: "Apply shader to [SPRITE]",
          arguments: {
            SPRITE: {
              type: Scratch.ArgumentType.STRING,
              menu: "SPRITE_MENU_WITH_MYSELF",
            },
          },
        },
      ],
      menus: {
        SPRITE_MENU_WITH_MYSELF: {
          acceptReporters: true,
          items: "__spriteMenuWithMyself",
        },
      },
    }
  }

  applyShader({ SPRITE }, util) {
    const target = this.__getTargetByIdOrName(SPRITE, util)
    const currentCostume = target.getCurrentCostume()

    this.__check_shaderedSprites(target, currentCostume)
    const shaderedObject = this.shaderedSprites[target.id]
    const gl = shaderedObject.gl
    const canvas = shaderedObject.canvas
    const skin = shaderedObject.skin
    const positionBuffer = shaderedObject.positionBuffer

    const img = new Image()
    img.src = currentCostume.asset.encodeDataURI()

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    gl.viewport(0, 0, canvas.width, canvas.height)

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    const textureOptions = {
      //mag: gl.NEAREST,
      //min: gl.LINEAR,
      src: img,
      //wrap: gl.CLAMP_TO_EDGE
    }
    const texture = twgl.createTexture(gl, textureOptions)

    const uniforms = {
      u_resolution: [canvas.width, canvas.height],
      u_color: [Math.random(), Math.random(), Math.random(), 1],
      u_skin: texture
    }

    const programInfo = twgl.createProgramInfo(gl, [vertexShaderSource, fragmentShaderSource])
  
    gl.useProgram(programInfo.program)
    twgl.setBuffersAndAttributes(gl, programInfo, positionBuffer)

    twgl.setUniforms(programInfo, uniforms)
    twgl.drawBufferInfo(gl, positionBuffer)

    skin.setContent(canvas)
    this.runtime.requestRedraw()
  }

  __check_shaderedSprites(target, currentCostume) {

    if (this.shaderedSprites[target.name]) return;

    const canvas = document.createElement("canvas")
    const gl = canvas.getContext("webgl2")
    if (!gl) {
      console.error(target.name, ": WebGL2 not supported!")
    }

    const positionBuffer = twgl.createBufferInfoFromArrays(gl, {
      position: {
          numComponents: 2,
          data: [
            -1, -1,
            1, -1,
            -1, 1,
            -1, 1,
            1, -1,
            1, 1,
          ]
      },
    })

    let skinId = this.runtime.renderer._nextSkinId++
    let SkinsClass = new Skins(this.runtime)
    let skin = new SkinsClass.SimpleSkin(
      skinId,
      this.runtime.renderer,
    )
    this.runtime.renderer._allSkins[skinId] = skin;
    this.runtime.renderer.updateDrawableSkinId(target.drawableID, skinId)
    skin.size = currentCostume.size

    this.shaderedSprites[target.id] = {
      "drawableID": target.drawableID,
      "skinId": skinId,
      "skin": skin,
      "canvas": canvas,
      "gl": gl,
      "positionBuffer": positionBuffer
    }
  }

  __getTargetByIdOrName(name, util) {
    if (name === '__myself__') return util.target
    let target = this.runtime.getSpriteTargetByName(name)
    if (!target) {
      target = this.runtime.getTargetById(name)
      if (!target) return null
    }
    return target
  }

  __getSpriteMenu() {
    const { targets } = this.runtime
    // 跳过舞台
    const menu = targets
      .filter((target) => !target.isStage && target.isOriginal)
      .map((target) => ({
        text: target.sprite.name,
        value: target.sprite.name,
      }))
    // 空检查
    if (menu.length === 0) {
      menu.push({
        text: "-",
        value: "empty",
      })
    }
    return menu
  }

  __spriteMenuWithMyself() {
    const menu = this.__getSpriteMenu()
    if (!this.runtime._editingTarget) return menu
    // 当前角色名称
    const editingTargetName = this.runtime._editingTarget.sprite.name
    // 从列表删除自己
    const index = menu.findIndex((item) => item.value === editingTargetName)
    if (index !== -1) {
      menu.splice(index, 1)
    }
    // 列表第一项插入“自己”
    if (this.runtime._editingTarget.isStage) return menu
    menu.unshift({
      text: this.fm("me"),
      value: "__myself__",
    })
    return menu
  }
}

window.tempExt = {
  Extension: QuakeFragment,
  info: {
    name: "quakefragment.extensionName",
    description: "quakefragment.description",
    extensionId: "quakefragment",
    //iconURL: cover,
    insetIconURL: icon,
    featured: true,
    disabled: false,
    collaboratorList: [
      {
        collaborator: 'Fath11@Cocrea',
        collaboratorURL: 'https://cocrea.world/@Fath11',
      },
    ],
  },
  l10n: {
    "zh-cn": {
      "quakefragment.extensionName": "Quake Fragment",
      "quakefragment.description": "Better way to load fragment shaders",
    },
    en: {
      "quakefragment.extensionName": "Quake Fragment",
      "quakefragment.description": "Better way to load fragment shaders",
    },
  },
}
