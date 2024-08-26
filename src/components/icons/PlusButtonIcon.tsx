import { Icon, type IconProps } from "@chakra-ui/react";

export const PlusButtonIcon = (props: IconProps) => {
  return (
    <Icon
      fill="transparent"
      h="1px"
      viewBox="0 0 12 11"
      w="12px"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        clipRule="evenodd"
        d="M6.00008 0.166992C6.36827 0.166992 6.66675 0.465469 6.66675 0.833659V4.83366H10.6667C11.0349 4.83366 11.3334 5.13214 11.3334 5.50033C11.3334 5.86852 11.0349 6.16699 10.6667 6.16699H6.66675V10.167C6.66675 10.5352 6.36827 10.8337 6.00008 10.8337C5.63189 10.8337 5.33341 10.5352 5.33341 10.167V6.16699H1.33341C0.965225 6.16699 0.666748 5.86852 0.666748 5.50033C0.666748 5.13214 0.965225 4.83366 1.33341 4.83366H5.33341V0.833659C5.33341 0.465469 5.63189 0.166992 6.00008 0.166992Z"
        fill="#475569"
        fillRule="evenodd"
      />
    </Icon>
  );
};
