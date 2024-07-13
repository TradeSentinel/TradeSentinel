import BackButton from "../../components/homeComponents/BackButton";

export default function PageHeader({ name }: { name: string }) {
    return (
        <div className="sticky top-0 bg-[#EEF2F6] flex items-center justify-between">
            <BackButton />
            <h2 className="font-bold text-[1.125rem] text-[#202939] text-center">{name}</h2>
            <span className="invisible">yoo</span>
        </div>
    )
}
