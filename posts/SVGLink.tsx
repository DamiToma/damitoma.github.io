export default function SVGLink({href, text}: {href: string, text: string}) {
    return (    
        <div className="mb-4 border rounded shadow bg-black">
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full block text-left px-4 py-2 bg-black hover:bg-neutral-900 font-semibold focus:outline-none flex justify-between items-center text-white"
            >
                <span>{text}</span>
                <span className="ml-2">↗</span>
            </a>
        </div>   
    )
}