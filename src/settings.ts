let settings: Record<string,string> = {}
let prefix = 'endless-road'

// From: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API#testing_for_availability
// Types added by me
function storageAvailable(type: "localStorage" | "sessionStorage") {
    let storage: Storage;
    try {
        storage = window[type];
        const x = "__storage_test__";
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    } catch (e) {
        console.warn(e)
        return (
            e instanceof DOMException &&
            e.name === "QuotaExceededError" &&
            // acknowledge QuotaExceededError only if there's something already stored
            storage &&
            storage.length !== 0
        );
    }
}

let persistence: boolean | undefined;
export function persistenceSupported() {
    if (persistence) return persistence
    return storageAvailable("localStorage")
}

persistenceSupported()

export function getSetting(key: string, default_value: string) {
    return settings[key] ?? default_value
}

const handlers: Record<string, ((new_value: string, old_value: string | null) => void)[]> = {}
export function onChange(key: string, func: (new_value: string, old_value: string | null) => void): () => void {
    if (key in handlers) {
        handlers[key].push(func)
    } else {
        handlers[key] = [func]
    }
    return () => {
        handlers[key] = handlers[key].filter(val => val !== func)
    }
}

export function getSettings() {
    return settings
}

export function setSetting(key: string, value: string) {
    if (persistence) localStorage.setItem(`${prefix}:${key}`, value) 
        else handlers[key]?.forEach?.(func=>func(value,settings[key]))
    settings[key] = value
}

export function loadSettings() {
    if (!persistenceSupported()) return console.warn("No Persistence")
    for (const [ key, value ] of Object.entries(localStorage)) {
        if (key.startsWith(prefix)) {
            settings[key.slice(prefix.length+1)] = value
        }
    }
    console.log("loaded settings:", settings)
}

window.addEventListener("storage", e => {
    if (e.key.startsWith(prefix+":")) {
        settings[e.key.slice(prefix.length+1)] = e.newValue
        handlers[e.key.slice(prefix.length+1)]?.forEach?.(func=>func(e.newValue,e.oldValue))
    }
})